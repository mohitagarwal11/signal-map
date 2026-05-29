import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "../../assets/Icons";
import { getSearchResults } from "../../api/search.api";
import "./SearchBar.css";

export default function SearchBar({ onLocationSelect }) {
  const [searchVal, setSearchVal] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchRef = useRef(null);

  const handleSearch = async (e) => {
    if (e.key !== "Enter" || !searchVal.trim()) return;

    try {
      const data = await getSearchResults(searchVal);

      const results = data.filter(
        (item) => item.address?.country_code === "in",
      );

      setSearchResults(results);
      setDropdownOpen(results.length > 0);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleSelect = (result) => {
    setSearchVal(result.display_name);
    setDropdownOpen(false);

    onLocationSelect?.({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name,
      raw: result,
    });
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!searchRef.current?.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="search-bar" ref={searchRef}>
      <div className="search-bar-input">
        <SearchIcon />

        <input
          type="text"
          placeholder="Location or Pincode..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>

      {dropdownOpen && (
        <div className="search-bar-dropdown">
          {searchResults.map((result) => (
            <div
              key={result.place_id}
              className="search-bar-item"
              onClick={() => handleSelect(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
