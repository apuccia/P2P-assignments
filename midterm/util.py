import requests
import re
import logging

# base_api endpoint
base_api = "http://localhost:5001/api/v0/"

bitswap_stat_api = base_api + "bitswap/stat"
dag_stat_api = base_api + "dag/stat"
block_stat_api = base_api + "block/stat"
ledger_api = base_api + "bitswap/ledger"
swarm_peers_api = base_api + "swarm/peers"
bootstrap_list_api = base_api + "bootstrap/list"
wantlist_api = base_api + "bitswap/wantlist"
shutdown_api = base_api + "shutdown"

id_api = base_api + "id"
gc_api = base_api + "repo/gc"

ip_api2 = "http://ipapi.co"


def get_my_id():
    return requests.post(id_api).json()


def get_bitswap_stat():
    req = requests.post(bitswap_stat_api, params={"human": "true", "verbose": "true"})
    resp = req.json()

    peers = []
    for peer in resp["Peers"]:
        req = requests.post(ledger_api, params={"arg": peer})
        peers.append(req.json())

    return peers


def get_current_wantlist(peer_id):
    req = requests.post(wantlist_api, params={"peer": peer_id})
    resp = req.json()

    return resp["Keys"]


def get_block_stat(block_cid):
    return requests.post(block_stat_api, params={"arg": block_cid}).json()


def get_ips_from_ids(peers):
    ips = set()
    for peer in peers:

        req = requests.post(id_api, params={"arg": peer.split("/")[-1]}).json()

        if "Addresses" in req:
            for addr in req["Addresses"]:
                splitted_addr = addr.split("/")
                # Considering only ip4 addresses
                if splitted_addr[1] == "ip4" and re.search("(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)", splitted_addr[2]) is None:
                    ips.add(splitted_addr[2])

    return ips


def get_swarm_ips():
    req = requests.post(swarm_peers_api).json()

    addresses = [peer["Addr"].split("/")[2] for peer in req["Peers"]]

    return addresses


def get_peers_locations(ips):
    countries = []
    regions = []
    cities = []
    country_codes = []
    cc_num_peers = {}

    for ip in ips:
        req = requests.get(f"{ip_api2}/{ip}/json/")

        sc = req.status_code

        if sc == 200:
            req = req.json()
            countries.append(req["country_name"])
            regions.append(req["region"])
            cities.append(req["country_name"])

            cc = req["country_code"].lower()
            country_codes.append(cc)
            if cc in cc_num_peers:
                cc_num_peers[cc] += 1
            else:
                cc_num_peers[cc] = 1

    return {
        "countries": countries,
        "regions": regions,
        "cities": cities,
        "country_codes": country_codes,
        "cc_num_peers": cc_num_peers,
    }


def get_bootstrap_nodes():
    return requests.post(bootstrap_list_api).json()


def get_dag_stat(cid):
    return requests.post(dag_stat_api, params={"arg": cid, "progress": "false"}).json()


def execute_gc():
    sc = requests.post(gc_api).status_code
    return sc


def shutdown():
    sc = requests.post(shutdown_api).status_code
    return sc
