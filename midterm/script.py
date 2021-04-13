import pprint as pp
import time
import os
import subprocess
import logging
import sys
import argparse

from datetime import datetime
from pathlib import Path

import util
import plot_utils


parser = argparse.ArgumentParser()
parser.add_argument(
    "-o", "--output", required=True, help="path where to store the files downloaded"
)
parser.add_argument(
    "-b",
    "--bootnodes",
    required=False,
    help="plot some information about bootstrap nodes",
    action="store_true",
)
parser.add_argument(
    "-s",
    "--swarmnodes",
    required=False,
    help="plot some information about swarm nodes",
    action="store_true",
)


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
fh = logging.FileHandler("info.log")
ch.setLevel(logging.DEBUG)
fh.setLevel(logging.DEBUG)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

ch.setFormatter(formatter)
fh.setFormatter(formatter)

logger.addHandler(ch)
logger.addHandler(fh)


def to_table_values(peers_info):
    table_values = []
    ids = []
    for peer in peers_info:
        ip_value = []
        for ip in peer["IPs_info"]:
            ids.append(peer["ID"])
            ip_value.append(ip["IP"])
            ip_value.append(ip["Country"])
            ip_value.append(ip["Region"])
            ip_value.append(ip["City"])
        table_values.append(ip_value)

    return table_values


def main():
    args = parser.parse_args()

    xkcd = "QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm"
    old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"

    Path("plots").mkdir(parents=True, exist_ok=True)
    logger.info("Plot directory created")

    # start downloading some files
    for cid in [xkcd, old_files]:
        Path(f"./plots/{cid}").mkdir(parents=True, exist_ok=True)
        # start daemon and wait some seconds for initialization
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[{cid}] Could not start the daemon, maybe it is already on?"
            )

        logger.info(f"[{cid}] Garbage collection: {util.execute_gc()}")

        # get node id
        my_id = util.get_my_id()["ID"]
        logger.info(f"[{cid}] My ID: {my_id}")

        get_proc = subprocess.Popen(f"ipfs get {cid} -o {args.output}", shell=True)
        logger.info(f"[{cid}] Started download")
        time.sleep(20)

        snap_thresh = 200
        timestamps = []
        rate_in_values = []
        rate_out_values = []
        # get some bw snapshot until threshold is zero or download ends
        while snap_thresh != 0 and get_proc.poll() is None:
            time.sleep(2)

            rate_in, rate_out = util.get_current_bw()
            logger.debug(f"[{cid}] Rate in: {rate_in}, Rate out: {rate_out}")

            current_time = datetime.now().strftime("%H:%M:%S")
            timestamps.append(current_time)
            rate_in_values.append(rate_in / 1024)
            rate_out_values.append(rate_out / 1024)
            snap_thresh -= 1

        get_proc.wait()
        logger.info(f"Download of {cid} ended")

        rate_values = {"Rate in": rate_in_values, "Rate out": rate_out_values}
        plot_utils.plot_line_chart(
            "Bandwidth snapshot (Kbs)",
            timestamps,
            rate_values.keys(),
            rate_values,
            f"./plots/{cid}",
        )

        # get object infos
        stat = util.get_object_stat(cid)
        logger.info(f"[{cid} Object stat] {pp.pformat(stat)}")

        # get bitswap stats
        peers = util.get_bitswap_stat()

        filtered_peers = list(filter(lambda x: x["Recv"] > 0 or x["Sent"] > 0, peers))
        logger.debug(f"[{cid} Filtered peers] {pp.pformat(filtered_peers)}")

        if len(filtered_peers) != 0:
            pie_values = {}
            for peer in filtered_peers:
                pie_values[peer["Peer"]] = [
                    {"value": peer["Recv"], "label": "Received"},
                    {"value": peer["Sent"], "label": "Sent"},
                ]

            blocks = [peer["Exchanged"] for peer in filtered_peers]
            exch_table_values = [
                [peer["Recv"], peer["Sent"], peer["Exchanged"]]
                for peer in filtered_peers
            ]

            logger.info(f"{cid} Plotting bytes pie chart")
            plot_utils.plot_pie_chart(
                "Content sent and received in bytes", pie_values, f"./plots/{cid}"
            )

            logger.info(f"{cid} Plotting exchanged blocks bar chart")
            ids = list(pie_values.keys())
            plot_utils.plot_bar_chart(
                "Content exchanged in blocks", ids, "Blocks", blocks, f"./plots/{cid}"
            )

            logger.info(f"{cid} Generating peers information table")
            plot_utils.generate_table(
                "Peers information",
                ids,
                ["Bytes received", "Bytes sent", "Blocks received"],
                exch_table_values,
                f"./plots/{cid}",
            )

            # show on map the peers from which we downloaded something
            peers_info = util.get_peers_info(ids)
            logger.debug(f"[{cid} Peers info] {pp.pformat(peers_info)}")

            ccs = util.get_numb_country_codes(peers_info)
            logger.info(f"{cid} Plotting peers map")
            plot_utils.plot_map(
                "Map of peers that exchanged with this node", ccs, f"./plots/{cid}"
            )

            logger.info(f"{cid} Generating peers geolocalization table")
            geo_table_values = to_table_values(peers_info)

            plot_utils.generate_table(
                "Peers geolocalization information",
                ids,
                ["IP", "Country", "Region", "City"],
                geo_table_values,
                f"./plots/{cid}",
            )

        logger.info(f"{cid} Shutdown: {util.shutdown()}")

    if args.bootnodes:
        # start daemon
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[Boot nodes] Could not start the daemon, maybe it is already on?"
            )

        # get bootstrap nodes and locations, then generate map and table
        boots = util.get_bootstrap_nodes()
        logger.debug(f"[Bootstrap nodes] {pp.pformat(boots)}")

        if len(boots) != 0:
            boots_info = util.get_peers_info(boots)
            logger.debug(f"[Bootstrap nodes info] {pp.pformat(boots_info)}")

            logger.info("Plotting bootstrap nodes map")
            ccs = util.get_numb_country_codes(boots_info)
            plot_utils.plot_map("Map of bootstrap nodes", ccs, "./plots")

            logger.info("Generating bootstrap nodes table")
            boot_table_values = to_table_values(boots_info)

            plot_utils.generate_table(
                "Bootstrap nodes geolocalization info",
                ids,
                ["IP", "Country", "Region", "City"],
                boot_table_values,
                "./plots",
            )

    if args.swarmnodes:
        # start daemon
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[Swarm nodes] Could not start the daemon, maybe it is already on?"
            )

        # get swarm peers and locations, then generate map
        swarm_ids = util.get_swarm_ids()
        logger.debug(f"[Swarm nodes IDs] {swarm_ids}")

        if len(swarm_ids) != 0:
            swarm_info = util.get_peers_info(swarm_ids)
            logger.debug(f"[Swarm nodes infos] {pp.pformat(swarm_info)}")

            logger.info("Plotting swarm nodes map")
            ccs = util.get_numb_country_codes(swarm_info)
            plot_utils.plot_map("Map of swarm nodes", ccs, "./plots")

            logger.info("Generating swarm nodes table")

            swarm_table_values = to_table_values(swarm_info)
            plot_utils.generate_table(
                "Swarm nodes info",
                ids,
                ["IP", "Country", "Region", "City"],
                swarm_table_values,
                "./plots",
            )

        logger.info(f"[Swarm] Shutdown: {util.shutdown()}")


if __name__ == "__main__":
    main()
