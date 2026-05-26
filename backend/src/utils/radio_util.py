NETWORK_RADIO_MAP = {
    "2G": ("GSM",),
    "3G": ("UMTS", "CDMA"),
    "4G": ("LTE",),
    "5G": ("NR",),
}


def _build_radio_filter_clause(alias, network):
    radio_values = NETWORK_RADIO_MAP.get(network)

    if not radio_values:
        return "", {}

    params = {f"radio_{i}": value for i, value in enumerate(radio_values)}

    placeholders = ", ".join(f":{key}" for key in params)

    return (
        f" AND {alias}.radio IN ({placeholders})",
        params,
    )
