import logging
import time

from fastapi import APIRouter
from controllers.towers_controller import (
    get_tower_count,
    get_towers,
    get_heatmap_points,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/")
def get_towers_route(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    limit: int = 100,
    offset: int = 0,
    network: str = "all",
    operator: str = "all",
):
    return get_towers(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        limit,
        offset,
        network,
        operator,
    )


@router.get("/count")
def get_towers_count_route(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    network: str = "all",
    operator: str = "all",
):
    return get_tower_count(min_lat, max_lat, min_lon, max_lon, network, operator)


@router.get("/heatmap")
def get_towers_heatmap_route(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    zoom: float,
    network: str = "all",
    operator: str = "all",
):
    return get_heatmap_points(
        min_lat,
        max_lat,
        min_lon,
        max_lon,
        zoom,
        network,
        operator,
    )
