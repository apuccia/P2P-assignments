import pprint as pp
import time
import os
import subprocess
import math
import pygal
import logging
import sys

import matplotlib.pyplot as plt

from datetime import datetime
from pygal_maps_world.maps import World
from pathlib import Path

import util

# create logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
fh = logging.FileHandler("info.log")
ch.setLevel(logging.DEBUG)
fh.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# add formatter to ch
ch.setFormatter(formatter)
fh.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)
logger.addHandler(fh)


def plot_line_chart(name, timestamps, value_names, values, save_path):
    line_chart = pygal.Line(x_label_rotation=45, show_minor_x_labels=False)
    line_chart.title = name
    line_chart.x_labels = timestamps
    chart.x_labels_major = timestamps[::20]
    for value_name in value_names:
        line_chart.add(value_name, values[value_name])

    line_chart.value_formatter = lambda x: '%.2f' % x

    line_chart.render_to_file(f"{save_path}/{name}.svg")
    line_chart.render_to_png(f"{save_path}/{name}.png")


def plot_bar_chart(name, peer_names, value_name, values, save_path):
    bar_chart = pygal.Bar(x_label_rotation=90)
    bar_chart.title = name
    bar_chart.x_labels = peer_names

    bar_chart.add(value_name, values)
    bar_chart.render_to_file(f"{save_path}/{name}.svg")
    bar_chart.render_to_png(f"{save_path}/{name}.png")


def plot_pie_chart(name, dict_pairs, save_path):
    pie_chart = pygal.Pie()
    pie_chart.title = name
    for key in dict_pairs:
        pie_chart.add(key, dict_pairs[key])
    pie_chart.render_to_file(f"{save_path}/{name}.svg")
    pie_chart.render_to_png(f"{save_path}/{name}.png")


def plot_map(name, countries, save_path):
    worldmap_chart = World()
    worldmap_chart.title = name
    worldmap_chart.add(name, countries)
    worldmap_chart.render_to_file(f"{save_path}/{name}.svg")
    worldmap_chart.render_to_png(f"{save_path}/{name}.png")


def generate_table(name, row_headers, col_headers, values, save_path):
    table = plt.table(cellText=values, 
        rowLabels=row_headers, colLabels=col_headers, loc="center", cellLoc="center")
    table.scale(1.5, 1.5)

    plt.axis("off")
    plt.grid(False)
    plt.savefig(f"{save_path}/{name}.png", bbox_inches="tight")
    plt.clf()


def main():
    ietf_rfc_archive = "QmNvTjdqEPjZVWCvRWsFJA1vK7TTw1g9JP6we1WBJTRADM"
    xkcd = "QmdmQXB2mzChmMeKY47C43LxUdg1NDJ5MWcKMKxDu7RgQm"
    old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"
    
    Path("plots").mkdir(parents=True, exist_ok=True)
    logger.info("Plot directory created")

    # start downloading some files
    for cid in [ietf_rfc_archive, xkcd, old_files]:
        Path(f"./plots/{cid}").mkdir(parents=True, exist_ok=True)
        # start daemon
        d = subprocess.Popen("ipfs daemon --init", shell=True)
        time.sleep(5)

        logger.info(f"Garbage collection: {util.execute_gc()}")

        # get node id
        my_id = util.get_my_id()["ID"]
        logger.info(f"My ID: {my_id}")

        logger.info(f"Started download of {cid}")
        proc = subprocess.Popen(
            f"ipfs get {cid} -o ./prova",
            shell=True
        )

        snap_thresh = 200
        timestamps = []
        rate_in_values = []
        rate_out_values = []
        while snap_thresh != 0 and proc.poll() is None:
            time.sleep(1)
            rate_in, rate_out = util.get_current_bw()

            logger.debug(f"Rate in: {rate_in}, Rate out: {rate_out}")
            current_time = datetime.now().strftime("%H:%M:%S")
            timestamps.append(current_time)
            rate_in_values.append(rate_in / 1024)
            rate_out_values.append(rate_out / 1024)
            snap_thresh -= 1

        proc.wait()
        logger.info("Download ended")

        values = {
            "Rate in": rate_in_values,
            "Rate out": rate_out_values
        }
        plot_line_chart("Bandwidth snapshot (Kbs)", timestamps, values.keys(), values, f"./plots/{cid}")

        # get dag infos
        stat = util.get_object_stat(cid)
        logger.info(f"[{cid} Object stat] {pp.pformat(stat)}")

        # get bitswap stats
        peers = util.get_bitswap_stat()

        filtered_peers = list(filter(lambda x: x["Recv"] > 0 or x["Sent"] > 0, peers))
        logger.debug(f"[Filtered peers] {pp.pformat(filtered_peers)}")

        if len(filtered_peers) != 0:
            pie_values = {}
            for peer in filtered_peers:
                pie_values[peer["Peer"]] = [
                    {"value": peer["Recv"], "label": "Received"}, 
                    {"value": peer["Sent"], "label": "Sent"}
                ]

            peers_blocks = [peer["Exchanged"] for peer in filtered_peers]
            peers_total_values = [[peer["Recv"], peer["Sent"], peer["Exchanged"]] for peer in filtered_peers]

            logger.info("Plotting bytes pie chart")
            plot_pie_chart("Content sent and received in bytes", pie_values, f"./plots/{cid}")

            logger.info("Plotting exchanged blocks bar chart")
            names = list(pie_values.keys())
            plot_bar_chart("Content exchanged in blocks", names, "Blocks", peers_blocks, f"./plots/{cid}")

            logger.info("Generating peers information table")
            generate_table(
                "Peers information",
                names,
                ["Bytes received", "Bytes sent", "Blocks received"],
                peers_total_values, 
                f"./plots/{cid}"
            )

            # show on map the peers from which we downloaded something
            peers_infos = util.get_peers_info(names)
            logger.debug(f"[Peers infos] {pp.pformat(peers_infos)}")

            ccs = util.get_numb_country_codes(peers_infos)
            logger.info("Plotting peers map")
            plot_map("Map of peers that exchanged with this node", ccs, f"./plots/{cid}")

            logger.info("Generating peers geolocalization table")
            values = []
            ids = []
            for peer in peers_infos:
                ip_value = []
                for ip in peer["IPs_info"]:
                    ids.append(peer["ID"])
                    ip_value.append(ip["IP"])
                    ip_value.append(ip["Country"])
                    ip_value.append(ip["Region"])
                    ip_value.append(ip["City"])
                values.append(ip_value)

            generate_table(
                "Peers geolocalization information",
                ids,
                ["IP", "Country", "Region", "City"],
                values,
                f"./plots/{cid}"
            )

        logger.info(f"Shutdown: {util.shutdown()}")


    # start daemon
    d = subprocess.Popen("ipfs daemon --init", shell=True)
    time.sleep(5)

    # get bootstrap nodes and locations, then generate map and table
    boots = util.get_bootstrap_nodes()
    logger.debug(f"[Bootstrap nodes] {pp.pformat(boots)}")

    if len(boots) != 0:
        boots_infos = util.get_peers_info(boots)
        logger.debug(f"[Bootstrap nodes infos] {pp.pformat(boots_infos)}")

        logger.info("Plotting bootstrap nodes map")
        ccs = util.get_numb_country_codes(boots_infos)
        plot_map("Map of bootstrap nodes", ccs, "./plots")

        logger.info("Generating bootstrap nodes table")
        values = []
        ids = []
        for boot in boots_infos:
            ip_value = []
            for ip in boot["IPs_info"]:
                ids.append(boot["ID"])
                ip_value.append(ip["IP"])
                ip_value.append(ip["Country"])
                ip_value.append(ip["Region"])
                ip_value.append(ip["City"])
            values.append(ip_value)

        generate_table(
            "Bootstrap nodes geolocalization info",
            ids,
            ["IP", "Country", "Region", "City"],
            values,
            "./plots"
        )

    # get swarm peers and locations, then generate map
    swarm_ids = util.get_swarm_ids()
    logger.debug(f"[Swarm nodes IDs] {swarm_ids}")

    if len(swarm_ids) != 0:
        swarm_infos = util.get_peers_info(swarm_ids)
        logger.debug(f"[Swarm nodes infos] {pp.pformat(swarm_infos)}")

        logger.info("Plotting swarm nodes map")
        ccs = util.get_numb_country_codes(swarm_infos)
        plot_map("Map of swarm nodes", ccs, "./plots")

        logger.info("Generating swarm nodes table")
        
        values = []
        ids = []
        for peer in swarm_infos:
            ip_value = []
            for ip in peer["IPs_info"]:
                ids.append(peer["ID"])
                ip_value.append(ip["IP"])
                ip_value.append(ip["Country"])
                ip_value.append(ip["Region"])
                ip_value.append(ip["City"])
            values.append(ip_value)
        generate_table(
            "Swarm nodes info",
            ids,
            ["IP", "Country", "Region", "City"],
            values,
            "./plots"
        )


    logger.info(f"Shutdown: {util.shutdown()}")

if __name__ == "__main__":
    main()
