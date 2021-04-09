import pprint as pp
import time
import os
import subprocess
import math
import pygal
import logging
import sys

import matplotlib.pyplot as plt

from pygal_maps_world.maps import World
from pathlib import Path

import util


def plot_bar_chart(name, peer_names, value_name, blocks):
    line_chart = pygal.Bar(x_label_rotation=90)
    line_chart.title = name
    line_chart.x_labels = peer_names

    line_chart.add(value_name, blocks)
    line_chart.render_to_file(f"./plots/{name}.svg")
    line_chart.render_to_png(f"./plots/{name}.png")


def plot_pie_chart(name, dict_pairs):
    pie_chart = pygal.Pie()
    pie_chart.title = name
    for key in dict_pairs:
        pie_chart.add(key, dict_pairs[key])
    pie_chart.render_to_file(f"./plots/{name}.svg")
    pie_chart.render_to_png(f"./plots/{name}.png")


def plot_map(name, countries):
    worldmap_chart = World()
    worldmap_chart.title = name
    worldmap_chart.add(name, countries)
    worldmap_chart.render_to_file(f"./plots/{name}.svg")
    worldmap_chart.render_to_png(f"./plots/{name}.png")


def generate_table(name, row_headers, col_headers, values):
    table = plt.table(cellText=values, rowLabels=row_headers, colLabels=col_headers, loc="center", cellLoc="center")
    table.scale(1.5, 1.5)

    plt.axis("off")
    plt.grid(False)
    plt.savefig(f"./plots/{name}.png", bbox_inches="tight")
    plt.clf()


def main():
    # apollo_files = "QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"
    old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"

    files_to_get = [old_files]
    Path("plots").mkdir(parents=True, exist_ok=True)
    logging.info("Plot directory created")

    # start daemon
    daemon = subprocess.Popen("ipfs daemon --init", shell=True)
    time.sleep(2)
    if daemon.poll() is None:
        logging.info("Daemon started")
    else:
        logging.warning("Could not start the daemon. Maybe it is already started?")

    # get node id
    my_id = util.get_my_id()["ID"]
    logging.info(f"My ID: {my_id}")

    # start downloading some files
    logging.info("Started download")
    proc = subprocess.Popen(
        f"ipfs get {old_files} -o D:\\prova",
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    while proc.poll() is None:
        curr_wantlist = util.get_current_wantlist(my_id)

        for block in curr_wantlist:
            block_size = util.get_block_stat(block["/"])["Size"]
            logging.info(
                f"[Wantlist (checked every 5 sec)] Block Cid: {block['/']}, Block size:  {block_size}"
            )
        time.sleep(5)
    logging.info("Download ended")

    # get dag infos
    old_files_dag = util.get_dag_stat(old_files)
    logging.info(f"[OldFiles DAG] {old_files_dag}")

    # get bitswap stats
    peers = util.get_bitswap_stat()

    filtered_peers = list(filter(lambda x: x["Recv"] > 0 or x["Sent"] > 0, peers))
    logging.debug(f"[Filtered peers] {pp.pformat(filtered_peers)}")

    if len(filtered_peers) != 0:
        pie_values = {}
        for peer in filtered_peers:
            pie_values[peer["Peer"]] = [{"value": peer["Recv"], "label": "Received"}, {"value": peer["Sent"], "label": "Sent"}]

        peers_blocks = [peer["Exchanged"] for peer in filtered_peers]
        peers_total_values = [[peer["Recv"], peer["Sent"], peer["Exchanged"]] for peer in filtered_peers]

        logging.info("Plotting bytes pie chart")
        plot_pie_chart("Content sent and received in bytes", pie_values)

        logging.info("Plotting exchanged blocks bar chart")
        names = list(pie_values.keys())
        plot_bar_chart("Content exchanged in blocks", names, "Blocks", peers_blocks)

        logging.info("Generating peers information table")
        generate_table(
            "Peers information",
            names,
            ["Bytes received", "Bytes sent", "Blocks received"],
            peers_total_values
        )

        # show on map the peers from which we downloaded something
        peers_infos = util.get_peers_info(names)
        logging.debug(f"[Peers infos] {pp.pformat(peers_infos)}")

        ccs = util.get_numb_country_codes(peers_infos)
        logging.info("Plotting peers map")
        plot_map("Map of peers that exchanged with this node", ccs)

        logging.info("Generating peers geolocalization table")
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
            values
        )


    # get bootstrap nodes and locations, then generate map and table
    boots = util.get_bootstrap_nodes()
    logging.debug(f"[Bootstrap nodes] {pp.pformat(boots)}")

    if len(boots) != 0:
        boots_infos = util.get_peers_info(boots)
        logging.debug(f"[Bootstrap nodes infos] {pp.pformat(boots_infos)}")

        logging.info("Plotting bootstrap nodes map")
        ccs = util.get_numb_country_codes(boots_infos)
        plot_map("Map of bootstrap nodes", ccs)

        logging.info("Generating bootstrap nodes table")
        values = []
        ids = []
        for boot in boots_infos:
            ip_value = []
            for ip in boot["IPs_info"]:
                ids.append(peer["ID"])
                ip_value.append(ip["IP"])
                ip_value.append(ip["Country"])
                ip_value.append(ip["Region"])
                ip_value.append(ip["City"])
            values.append(ip_value)

        generate_table(
            "Bootstrap nodes geolocalization info",
            ids,
            ["IP", "Country", "Region", "City"],
            values
        )

    # get swarm peers and locations, then generate map
    swarm_ids = util.get_swarm_ids()
    logging.debug(f"[Swarm nodes IDs] {swarm_ids}")

    if len(swarm_ids) != 0:
        swarm_infos = util.get_peers_info(swarm_ids)
        logging.debug(f"[Swarm nodes infos] {pp.pformat(swarm_infos)}")

        logging.info("Plotting swarm nodes map")
        ccs = util.get_numb_country_codes(swarm_infos)
        plot_map("Map of swarm nodes", ccs)

        logging.info("Generating swarm nodes table")
        
        values = []
        ids = []
        for peer in swarm_infos:
            ip_value = []
            for ip in boot["IPs_info"]:
                ids.append(peer["ID"])
                ip_value.append(ip["IP"])
                ip_value.append(ip["Country"])
                ip_value.append(ip["Region"])
                ip_value.append(ip["City"])
            values.append(ip_value)
        print(len(ids))
        print(len(values))
        generate_table(
            "Swarm nodes info",
            ids,
            ["IP", "Country", "Region", "City"],
            values,
        )

    #logging.info(f"Garbage collection: {util.execute_gc()}")
    #logging.info(f"Shutdown: {util.shutdown()}")


if __name__ == "__main__":
    logging.basicConfig(filename="info.log", level=logging.DEBUG)
    logging.StreamHandler(sys.stdout)

    main()
