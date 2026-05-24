from fastapi import APIRouter
from controllers.towers_controller import (
    get_tower_clusters,
    get_tower_count,
    get_towers,
)

router = APIRouter()


@router.get("/")
def get_towers_route(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    limit: int = 100,
    offset: int = 0,
):
    return get_towers(min_lat, max_lat, min_lon, max_lon, limit, offset)


@router.get("/count")
def get_towers_count_route(
    min_lat: float, max_lat: float, min_lon: float, max_lon: float
):
    return get_tower_count(min_lat, max_lat, min_lon, max_lon)


@router.get("/clusters")
def get_tower_clusters_route(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    zoom: float,
):
    return get_tower_clusters(min_lat, max_lat, min_lon, max_lon, zoom)
