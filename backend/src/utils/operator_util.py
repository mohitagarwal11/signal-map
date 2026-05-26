def _build_operator_filter_clause(alias, operator):
    if not operator or operator == "all":
        return "", {}

    return f" AND {alias}.operator_name = :operator", {"operator": operator}
