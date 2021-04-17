import pprint as pp
import time
import os
import subprocess
import logging
import sys
import argparse
import math

from datetime import datetime
from pathlib import Path

import api_utils
import plot_utils


xkcd = "QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm"
old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"
rfc_archive = "QmNvTjdqEPjZVWCvRWsFJA1vK7TTw1g9JP6we1WBJTRADM"


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
parser.add_argument(
    "-c",
    "--cids",
    nargs="+",
    required=False,
    help="specify cids of the files to download separated by spaces",
)


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ch = logging.StreamHandler(sys.stdout)
fh = logging.FileHandler("info.log")
ch.setLevel(logging.INFO)
fh.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

ch.setFormatter(formatter)
fh.setFormatter(formatter)

logger.addHandler(ch)
logger.addHandler(fh)


def convert_size(size_bytes):
    if size_bytes == 0:
        return "0 B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return "%s %s" % (s, size_name[i])


def to_table_values(peers_info):
    table_values = []
    ids = []
    for peer in peers_info:
        for ip in peer["IPs_info"]:
            ip_value = []
            ids.append(peer["ID"])
            ip_value.append(ip["IP"])
            ip_value.append(ip["Country"])
            ip_value.append(ip["Region"])
            ip_value.append(ip["City"])
            table_values.append(ip_value)

    return table_values, ids


""" 
returns an object containing, for each country code, 
the number of peers that were geolocalized in that country 
"""
def get_numb_country_codes(peers):
    ccs = {}
    for peer in peers:
        for ip in peer["IPs_info"]:
            cc = ip["Country_code"]
            if cc in ccs:
                ccs[cc] += 1
            else:
                ccs[cc] = 1

    return ccs


def main():
    args = parser.parse_args()

    # standard cids used for the experiment
    cids = [xkcd, old_files, rfc_archive]
    if args.cids:
        cids = args.cids

    Path("plots").mkdir(parents=True, exist_ok=True)
    logger.info("Plot directory created")

    logger.info(f"Files that will be downloaded (cids)\n{pp.pformat(cids)}")

    # start downloading some files
    for cid in cids:
        # start daemon and wait some seconds for initialization
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[{cid}] Could not start the daemon, maybe it is already on?"
            )

        # get object info
        stat = api_utils.get_object_stat(cid)
        if stat is None:
            logger.warning(
                f"[{cid}] Error retrieving information about this cid, maybe it does not exist?"
            )
            continue
        logger.info(f"[{cid}] Object stat\n{pp.pformat(stat)}")
        total_size = convert_size(stat["CumulativeSize"])
        logger.info(f"[{cid}] Total size {total_size}")

        Path(f"./plots/{cid}").mkdir(parents=True, exist_ok=True)

        # get node id
        my_id = api_utils.get_my_id()["ID"]
        logger.info(f"[{cid}] My ID: {my_id}")

        get_proc = subprocess.Popen(
            f"ipfs get {cid} -o {args.output}/{cid}", shell=True
        )
        logger.info(f"[{cid}] Issued download command")
        time.sleep(60)

        # get some bandwidth snapshot until snap_thresh is zero or download ends
        snap_thresh = 500
        timestamps = []
        rate_in_values = []
        rate_out_values = []
        average_in = 0
        average_out = 0
        while snap_thresh != 0 and get_proc.poll() is None:
            time.sleep(1)

            rate_in, rate_out = api_utils.get_current_bw()
            rate_in = round(rate_in / 1024, 2)
            rate_out = round(rate_out / 1024, 2)
            logger.debug(f"[{cid}] Rate in: {rate_in}, Rate out: {rate_out}")
            average_in += rate_in
            average_out += rate_out

            current_time = datetime.now().strftime("%H:%M:%S")
            timestamps.append(current_time)
            rate_in_values.append(rate_in)
            rate_out_values.append(rate_out)

            snap_thresh -= 1

        # wait till download ends
        get_proc.wait()
        logger.info(f"[{cid}] Download ended")

        # compute average bandwidth rate
        snaps_done = 500 - snap_thresh
        if snaps_done != 0:
            average_in /= snaps_done
            average_out /= snaps_done
        logger.info(
            (f"[{cid}] Snaps: {snaps_done} Period: {timestamps[0]} - {timestamps[-1]} "
             f" Average rate in (Kbps): {average_in} Average rate out (Kbps): {average_out}")
        )

        rate_values = {"Rate in": rate_in_values, "Rate out": rate_out_values}
        logger.info(f"[{cid}] Started plotting bandwidth chart")
        plot_utils.plot_line_chart(
            "Bandwidth snapshot (KBps)",
            timestamps,
            rate_values.keys(),
            rate_values,
            f"./plots/{cid}",
        )

        # get bitswap stats
        peers, stats = api_utils.get_bitswap_stat()
        logger.info(
            f"[{cid}] Bitswap total received: {convert_size(stats['DataReceived'])}"
        )
        logger.info(
            f"[{cid}] Bitswap duplicate data: {convert_size(stats['DupDataReceived'])}"
        )
        filtered_peers = list(filter(lambda x: x["Recv"] > 0 or x["Sent"] > 0, peers))
        logger.debug(f"[{cid}] Filtered peers\n{pp.pformat(filtered_peers)}")

        if len(filtered_peers) != 0:
            pie_values = {}
            total_received = 0
            total_sent = 0
            for peer in filtered_peers:
                id_info = api_utils.get_id(peer["Peer"])
                # get other info about the peer
                peer["Agent version"] = id_info["AgentVersion"]
                peer["Protocol version"] = id_info["ProtocolVersion"]

                # get latency string and consider only the average
                ping = api_utils.ping(peer["Peer"]).split(":")[-1][1:-3]
                peer["Latency"] = ping

                logger.debug(f"[{cid}]\n{pp.pformat(peer)}")

                total_received += peer["Recv"]
                total_sent += peer["Sent"]
                pie_values[peer["Peer"]] = [
                    {"value": round(peer["Recv"] / 1024, 2), "label": "Received"},
                    {"value": round(peer["Sent"] / 1024, 2), "label": "Sent"},
                ]

            logger.info(f"[{cid}] Ledger total received: {convert_size(total_received)}")
            logger.info(f"[{cid}] Ledger total sent: {convert_size(total_sent)}")

            logger.info(f"[{cid}] Plotting KB pie chart")
            plot_utils.plot_pie_chart(
                "Content sent and received in KB", pie_values, f"./plots/{cid}"
            )

            ids = list(pie_values.keys())
            blocks = [peer["Exchanged"] for peer in filtered_peers]
            logger.info(f"[{cid}] Plotting exchanged blocks bar chart")
            plot_utils.plot_bar_chart(
                "Content exchanged in blocks", ids, "Blocks", blocks, f"./plots/{cid}"
            )

            exch_table_values = [
                # one row of the table for each peer id
                [
                    peer["Agent version"],
                    peer["Protocol version"],
                    peer["Latency"],
                    convert_size(peer["Recv"]),
                    convert_size(peer["Sent"]),
                    peer["Exchanged"],
                ]
                for peer in filtered_peers
            ]
            logger.info(f"[{cid}] Generating peers information table")
            plot_utils.generate_table(
                "Peers information",
                ids,
                ["Agent version", "Protocol version", "Latency", "Received", "Sent", "Blocks exchanged"],
                exch_table_values,
                f"./plots/{cid}",
            )

            # show on map the peers from which we downloaded something
            logger.info(
                f"[{cid}] Started getting geolocalization information"
            )
            peers_info = api_utils.get_peers_info(ids)
            logger.debug(f"[{cid}] Peers info:\n{pp.pformat(peers_info)}")

            ccs = get_numb_country_codes(peers_info)
            logger.info(f"[{cid}] Plotting peers map")
            plot_utils.plot_map(
                "Map of peers that exchanged with this node", ccs, f"./plots/{cid}"
            )

            geo_table_values, ids = to_table_values(peers_info)
            logger.debug(f"[Peers]\n{pp.pformat(geo_table_values)}")

            logger.info(f"[{cid}] Generating peers geolocalization table")
            plot_utils.generate_table(
                "Peers geolocalization information",
                ids,
                ["IP", "Country", "Region", "City"],
                geo_table_values,
                f"./plots/{cid}",
            )

        logger.info(f"[{cid}] Garbage collection: {api_utils.execute_gc()}")
        logger.info(f"[{cid}] Shutdown: {api_utils.shutdown()}")

    # option -b/--bootnodes specified
    if args.bootnodes:
        # start daemon
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[Boot nodes] Could not start the daemon, maybe it is already on?"
            )

        # get bootstrap nodes and locations, then generate map and table
        boots = api_utils.get_bootstrap_nodes()
        logger.debug(f"[Bootstrap nodes]\n{pp.pformat(boots)}")

        if len(boots) != 0:
            logger.info(
                f"[Bootstrap nodes info] Started getting geolocalization information"
            )
            boots_info = api_utils.get_peers_info(boots)
            logger.debug(f"[Bootstrap nodes info]\n{pp.pformat(boots_info)}")

            logger.info("Plotting bootstrap nodes map")
            ccs = get_numb_country_codes(boots_info)
            plot_utils.plot_map("Map of bootstrap nodes", ccs, "./plots")

            logger.info("Generating bootstrap nodes table")
            boot_table_values, boot_ids = to_table_values(boots_info)
            logger.debug(f"[Boots]\n{pp.pformat(boot_table_values)}")

            plot_utils.generate_table(
                "Bootstrap nodes geolocalization info",
                boot_ids,
                ["IP", "Country", "Region", "City"],
                boot_table_values,
                "./plots",
            )
        logger.info(f"[Swarm] Shutdown: {api_utils.shutdown()}")

    # option -s/--swarmnodes specified
    if args.swarmnodes:
        # start daemon
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        if d.poll() != None:
            logger.warning(
                f"[Swarm nodes] Could not start the daemon, maybe it is already on?"
            )

        # get swarm peers and locations, then generate map and table
        swarm_ids = api_utils.get_swarm_ids()
        logger.debug(f"[Swarm nodes IDs]\n{pp.pformat(swarm_ids)}")

        if len(swarm_ids) != 0:
            logger.info(
                f"[Swarm nodes info] Started getting geolocalization information"
            )
            swarm_info = api_utils.get_peers_info(swarm_ids)
            logger.debug(f"[Swarm nodes infos]\n{pp.pformat(swarm_info)}")

            ccs = get_numb_country_codes(swarm_info)
            logger.info("Plotting swarm nodes map")
            plot_utils.plot_map("Map of swarm nodes", ccs, "./plots")

            swarm_table_values, swarm_ids = to_table_values(swarm_info)
            logger.debug(f"[Swarm]\n{pp.pformat(swarm_table_values)}")
            logger.info("Generating swarm nodes table")
            plot_utils.generate_table(
                "Swarm nodes info",
                swarm_ids,
                ["IP", "Country", "Region", "City"],
                swarm_table_values,
                "./plots",
            )

        logger.info(f"[Swarm] Shutdown: {api_utils.shutdown()}")


if __name__ == "__main__":
    main()
