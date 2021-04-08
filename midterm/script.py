import pprint as pp
import time
import os
import subprocess
import math
from pygal_maps_world.maps import World
import pygal

import util


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


def generate_table(row_headers, country_names, regions, cities, num_bytes, blocks):
    line_chart = pygal.Bar()
    line_chart.title = "Peers statistics"
    line_chart.x_labels = row_headers

    line_chart.add("Country name", country_names)
    line_chart.add("Region", regions)
    line_chart.add("City", cities)
    line_chart.add("Bytes received", num_bytes)
    line_chart.add("Blocks received", blocks)
    line_chart.value_formatter = lambda x: str(x)

    return line_chart.render_table(style=True)


def main():
    # apollo_files = "QmSnuWmxptJZdLJpKRarxBMS2Ju2oANVrgbr2xWbie9b2D"
    old_files = "QmbsZEvJE8EU51HCUHQg2aem9JNFmFHdva3tGVYutdCXHp"

    files_to_get = [old_files]

    # get node id
    my_id = util.get_my_id()["ID"]
    print(f"My id: {my_id}")

    # start downloading some files
    sub_procs = [
        subprocess.Popen(
            f"ipfs get {file} -o D:\\prova",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for file in files_to_get
    ]

    for proc in sub_procs:
        while proc.poll() is None:
            print("---- WANTLIST (every 5 sec) ----")
            curr_wantlist = util.get_current_wantlist(my_id)

            for block in curr_wantlist:
                block_size = util.get_block_stat(block["/"])["Size"]
                print(f"Block Cid: {block['/']}, Block size:  {block_size}")
            time.sleep(5)

    # get dag infos
    old_files_dag = util.get_dag_stat(old_files)

    print("------ DAG ------")
    pp.pprint(f"OldFiles {old_files_dag}")

    # get bitswap stats
    peers = util.get_bitswap_stat()

    print("------ Peers from which we received something ------")
    filtered_peers = list(filter(lambda x: x["Recv"] > 0, peers))
    pp.pprint(filtered_peers)

    peers_names = [peer["Peer"] for peer in filtered_peers]
    peers_bytes = [peer["Recv"] for peer in filtered_peers]
    peers_blocks = [peer["Exchanged"] for peer in filtered_peers]

    plot_pie_chart("Content received in bytes", zip(peers_names, peers_bytes))
    plot_pie_chart("Content received in blocks", zip(peers_names, peers_blocks))

    # show on map the peers from which we downloaded something
    ips = util.get_ips_from_ids(peers_names)
    locations = util.get_peers_locations(ips)

    print(locations["cc_num_peers"])
    plot_map("Peer nodes", locations["cc_num_peers"])
    html = generate_table(
        peers_names,
        locations["countries"],
        locations["regions"],
        locations["cities"],
        peers_bytes,
        peers_blocks,
    )

    with open("./plots/table.html", "w") as table:
        table.write(html)

    # get bootstrap nodes and locations, then generate map
    boots = util.get_bootstrap_nodes()["Peers"]
    print(f"Bootstrap nodes: {len(boots)}")
    ips = util.get_ips_from_ids(boots)
    boots_locations = util.get_peers_locations(ips)
    pp.pprint(boots_locations)
    plot_map("Bootstrap nodes", boots_locations["cc_num_peers"])

    # get swarm peers and locations, then generate map
    ips = util.get_swarm_ips()
    print(f"Swarm nodes: {len(ips)}")
    swarm_locations = util.get_peers_locations(ips)
    pp.pprint(swarm_locations)
    plot_map("Swarm nodes", swarm_locations["cc_num_peers"])

    print(util.execute_gc())


if __name__ == "__main__":
    main()
