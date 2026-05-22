import { useEffect, useRef, useState } from "react";
import { getViewport } from "../utils/getViewport";
import { getTowerCount } from "../api/towers.api";

// for test only
const handleViewportChange = async (bounds) => {
  try {
    const response = await getTowerCount(
      bounds.min_lat,
      bounds.max_lat,
      bounds.min_lon,
      bounds.max_lon,
    );
    console.log("Tower count in viewport:", response.data);
  } catch (error) {
    console.log("Error fetching tower count:", error);
  }
};

function Map() {
  const map = useRef(null);

  useEffect(() => {
    if (!mappls) return;

    map.current = new mappls.Map("map", {
      center: [21, 85],
      zoom: 3.5,
      minZoom: 3.5,
      maxZoom: 15,
      traffic: false,
    });

    map.current.fitBounds([
      [67.0, 6.0],
      [98.0, 38.0],
    ]);

    map.current.setMaxBounds([
      [67.0, 6.0],
      [98.0, 38.0],
    ]);

    map.current.on("moveend", () => {
      const bounds = getViewport(map.current);
      handleViewportChange(bounds);
    });
  }, []);

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
}

export default Map;
