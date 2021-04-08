import pprint as pp
import time
import os
import subprocess
import math
import pygal
import logging

from pygal_maps_world.maps import World
from pathlib import Path

import util


def plot_bar_chart(name, peer_names, blocks):
    line_chart = pygal.Bar()
    line_chart.title = name
    line_chart.x_labels = peer_names
    line_chart.add("Blocks", blocks)
    line_chart.render_to_file(f"./plots/{name}.svg")
    line_chart.render_to_png(f"./plots/{name}.png")


def plot_pie_chart(name, dict_pairs):
    pie_chart = pygal.Pie()
    pie_chart.title = name
    for key, value in dict_pairs:
        pie_chart.add(key, value)
    pie_chart.render_to_file(f"./plots/{name}.svg")
    pie_chart.render_to_png(f"./plots/{name}.png")


def plot_map(name, countries):
    worldmap_chart = World()
    worldmap_chart.title = name
    worldmap_chart.add(name, countries)
    worldmap_chart.render_to_file(f"./plots/{name}.svg")
    worldmap_chart.render_to_png(f"./plots/{name}.png")


def generate_table(row_headers, pairs):
    line_chart = pygal.Bar()
    line_chart.title = "Peers statistics"
    line_chart.x_labels = row_headers

    for key, value in pairs:
        line_chart.add(key, value)

    line_chart.value_formatter = lambda x: str(x)

    return line_chart.render_table(style=True)


def main():
    # apollo_files = "QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"
    old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"

    files_to_get = [old_files]
    Path("/plots").mkdir(parents=True, exist_ok=True)
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
    logging.debug(f"[OldFiles DAG] {old_files_dag}")

    # get bitswap stats
    peers = util.get_bitswap_stat()

    filtered_peers = list(filter(lambda x: x["Recv"] > 0, peers))
    logging.debug(f"[Peers] {filtered_peers}")

    peers_names = [peer["Peer"] for peer in filtered_peers]
    peers_bytes = [peer["Recv"] for peer in filtered_peers]
    peers_blocks = [peer["Exchanged"] for peer in filtered_peers]

    logging.info("Plotting bytes pie chart")
    plot_pie_chart("Content received in bytes", zip(peers_names, peers_bytes))

    logging.info("Plotting blocks bar chart")
    plot_pie_chart("Content received in blocks", zip(peers_names, peers_blocks))

    # show on map the peers from which we downloaded something
    ips = util.get_ips_from_ids(peers_names)
    logging.debug(f"[Peers IP addresses] {ips}")

    peers_locations = util.get_peers_locations(ips)
    logging.debug(f"[Peers locations] {peers_locations}")

    logging.info("Plotting peers map")
    plot_map("Peers that exchanged with this node", peers_locations["cc_num_peers"])

    logging.info("Generating peers table")
    nodes_html = generate_table(
        peers_names,
        {
            "Country": peers_locations["countries"],
            "Region": peers_locations["regions"],
            "City": peers_locations["cities"],
            "Bytes": peers_bytes,
            "Blocks": peers_blocks,
        },
    )

    with open("./plots/Peers that exchanged with this node.html", "w") as table:
        table.write(nodes_html)

    # get bootstrap nodes and locations, then generate map and table
    boots = util.get_bootstrap_nodes()["Peers"]
    logging.debug(f"[Bootstrap nodes] {boots}")

    ips = util.get_ips_from_ids(boots)
    logging.debug(f"[Bootstrap nodes IP addresses] {ips}")

    boots_locations = util.get_peers_locations(ips)
    logging.debug(f"[Bootstrap nodes locations] {peers_locations}")

    logging.info("Plotting bootstrap nodes map")
    plot_map("Bootstrap nodes", boots_locations["cc_num_peers"])

    logging.info("Generating bootstrap nodes table")
    bootstrap_html = generate_table(
        peers_names,
        {
            "Country": boots_locations["countries"],
            "Region": boots_locations["regions"],
            "City": boots_locations["cities"],
        },
    )

    with open("./plots/Bootstrap nodes.html", "w") as table:
        table.write(bootstrap_html)

    # get swarm peers and locations, then generate map
    ips = util.get_swarm_ips()
    logging.debug(f"[Swarm nodes IP addresses] {ips}")

    swarm_locations = util.get_peers_locations(ips)
    logging.debug(f"[Swarm nodes locations] {swarm_locations}")

    logging.info("Plotting swarm nodes map")
    plot_map("Swarm nodes", swarm_locations["cc_num_peers"])

    logging.info("Generating swarm nodes table")
    swarm_html = generate_table(
        peers_names,
        {
            "Country": boots_locations["countries"],
            "Region": boots_locations["regions"],
            "City": boots_locations["cities"],
        },
    )

    with open("./plots/Swarm nodes.html", "w") as table:
        table.write(swarm_html)

    logging.info(f"Garbage collection: {util.execute_gc()}")
    logging.info(f"Shutdown: {util.shutdown()}")


if __name__ == "__main__":
    logging.basicConfig(filename="info.log", encoding="utf-8", level=logging.INFO)
    main()
