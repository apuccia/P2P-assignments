import requests
import re
import logging
import sys
import time

# base_api endpoint
base_api = "http://localhost:5001/api/v0/"

bitswap_stat_api = base_api + "bitswap/stat"
object_stat_api = base_api + "object/stat"
stats_bw_api = base_api + "stats/bw"
block_stat_api = base_api + "block/stat"
ledger_api = base_api + "bitswap/ledger"
swarm_addrs_api = base_api + "swarm/addrs"
bootstrap_list_api = base_api + "bootstrap/list"
wantlist_api = base_api + "bitswap/wantlist"
shutdown_api = base_api + "shutdown"

id_api = base_api + "id"
ping_api = base_api + "ping"
gc_api = base_api + "repo/gc"

# 1000 requests per day
geoloc_api = "http://ipapi.co"

# create logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

ch = logging.StreamHandler(sys.stdout)
fh = logging.FileHandler("info.log")
ch.setLevel(logging.INFO)
fh.setLevel(logging.INFO)

# create formatter
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

# add formatter to ch
ch.setFormatter(formatter)
fh.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)
logger.addHandler(fh)


def get_my_id():
    req = requests.post(id_api).json()

    return req


def get_id(id):
    req = requests.post(id_api, params={"arg": id}).json()

    return req


def ping(id):
    req = requests.post(ping_api, params={"arg": id}).text

    return req


def get_bitswap_stat():
    req = requests.post(bitswap_stat_api, params={"human": "true", "verbose": "true"})
    resp = req.json()

    peers_ledgers = []
    for peer in resp["Peers"]:
        req = requests.post(ledger_api, params={"arg": peer})
        peers_ledgers.append(req.json())

    return peers_ledgers, resp


def get_current_wantlist(peer_id):
    req = requests.post(wantlist_api, params={"peer": peer_id})
    resp = req.json()

    return resp["Keys"]


def get_block_stat(block_cid):
    return requests.post(block_stat_api, params={"arg": block_cid}).json()


def get_peers_info(peers):
    values = []
    for peer in peers:

        req = requests.post(id_api, params={"arg": peer}).json()

        if "Addresses" in req:
            unique_ips = set()
            ips = []
            for addr in req["Addresses"]:
                splitted_addr = addr.split("/")
                # Considering only ipv4 addresses
                ip = splitted_addr[2]
                regex = ("(^127\\.)|(^10\\.)|(^172\\.1[6-9]\\.)| "
                    "(^172\\.2[0-9]\\.)|(^172\\.3[0-1]\\.)|(^192\\.168\\.)")
                if (
                    splitted_addr[1] == "ip4"
                    and re.search(regex, ip) is None
                    and ip not in unique_ips
                ):
                    try:
                        req = requests.get(f"{geoloc_api}/{ip}/json/")
                    except requests.exceptions.RequestException as e:
                        logger.critical(e)
                        sys.exit(1)

                    sc = req.status_code
                    if sc == 200:
                        req = req.json()
                        ips.append(
                            {
                                "IP": ip,
                                "Country": req["country_name"]
                                if "country_name" in req
                                else "",
                                "Region": req["region"] if "region" in req else "",
                                "City": req["city"] if "city" in req else "",
                                "Country_code": req["country_code"].lower()
                                if "country_code" in req
                                else "",
                            }
                        )
                    else:
                        logger.warning(f"[ipapi.co] {req.status_code}")
                        ips.append(
                            {
                                "IP": ip,
                                "Country": "",
                                "Region": "",
                                "City": "",
                                "Country_code": ""
                            }
                        )   

                    unique_ips.add(ip)
                    # trying to avoid too many requests 429
                    time.sleep(3)

            values.append({"ID": peer, "IPs_info": list(ips)})

    return values


def get_swarm_ids():
    swarm_addresses = requests.post(swarm_addrs_api).json()
    ids = []

    thresh = 70
    for peer in swarm_addresses["Addrs"]:
        if thresh == 0:
            break
        ids.append(peer.split("/")[-1])
        thresh -= 1

    return ids


def get_bootstrap_nodes():
    boots_addresses = requests.post(bootstrap_list_api).json()["Peers"]
    ids = set()

    for boot in boots_addresses:
        ids.add(boot.split("/")[-1])

    return list(ids)


def get_current_bw():
    # new version of the protocol released in June 2020
    res = requests.post(stats_bw_api, params={"proto": "/ipfs/bitswap/1.2.0"}).json()

    rate_in = res["RateIn"]
    rate_out = res["RateOut"]
    return rate_in, rate_out


def get_object_stat(cid):
    res = requests.post(object_stat_api, params={"arg": cid}).json()

    if "Message" in res:
        logger.warning(res["Message"])
        return None

    return res


def execute_gc():
    sc = requests.post(gc_api).status_code
    return sc


def shutdown():
    sc = requests.post(shutdown_api).status_code
    return sc
