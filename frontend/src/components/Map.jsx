import { useEffect, useRef, useState } from "react";
import { getViewport } from "../utils/getViewport";
import { getTowerCount } from "../api/towers.api";

export default function Map({ setTowerCount, setTowerData, setMapCenter }) {
  const mapRef = useRef(null);
  const moveEndTimeoutRef = useRef(null);

  useEffect(() => {
    if (!mappls) return;

    const fetchTowerCount = async () => {
      const map = mapRef.current;

      if (!map) return;

      try {
        const bounds = getViewport(map);
        const response = await getTowerCount(bounds);

        setTowerCount(response.data.count);
        // console.log("Tower count in current viewport:", response.data.count);
      } catch (error) {
        console.log("Error fetching tower count:", error);
      }
    };

    const map = new mappls.Map("map", {
      center: [23, 85],
      zoom: 3.75,
      minZoom: 3.75,
      maxZoom: 15,
      fullscreenControl: false,
      rotateControl: false,
    });

    mapRef.current = map;

    // resets the existing timeout and sets a new one to fetch tower count after 250ms of inactivity
    const handleMoveEnd = () => {
      window.clearTimeout(moveEndTimeoutRef.current);
      moveEndTimeoutRef.current = window.setTimeout(fetchTowerCount, 300);

      const center = map.getCenter();
      setMapCenter({
        lat: center.lat.toPrecision(6),
        lon: center.lng.toPrecision(6),
      });

    };

    map.on("moveend", handleMoveEnd);

    fetchTowerCount();

    return () => {
      window.clearTimeout(moveEndTimeoutRef.current);
      map.off("moveend", handleMoveEnd);
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
