import { useState, useCallback } from 'react';
import { SearchIcon } from '../assets/Icons';
import { getSearchResults } from '../api/search.api';
import { useClickOutside } from '../utils/useClickOutside';

export default function SearchBar({ onLocationSelect }) {
  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const closeDropdown = useCallback(() => setDropdownOpen(false), []);
  const searchRef = useClickOutside(closeDropdown);

  const handleSearch = async (e) => {
    if (e.key !== 'Enter' || !searchVal.trim()) return;

    try {
      const data = await getSearchResults(searchVal);

      const results = data.filter((item) => item.address?.country_code === 'in');

      setSearchResults(results);
      setDropdownOpen(results.length > 0);
    } catch (err) {
      console.error('Search failed:', err);
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

  return (
    <div className="absolute top-4 left-4 w-80 z-[1000]" ref={searchRef}>
      <div className="flex items-center gap-3 h-[46px] px-3.5 bg-white/95 border border-[#cbd5e1] rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <SearchIcon />

        <input
          type="text"
          placeholder="Location or Pincode..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onKeyDown={handleSearch}
          className="flex-1 border-none outline-none bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8]"
        />
      </div>

      {dropdownOpen && (
        <div className="mt-1.5 bg-white/98 border border-[#cbd5e1] rounded-[10px] overflow-hidden max-h-64 overflow-y-auto shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {searchResults.map((result) => (
            <div
              key={result.place_id}
              className="px-3.5 py-3 text-sm text-[#0f172a] cursor-pointer border-b border-[#cbd5e1]/60 transition-[background] duration-150 ease-in-out last:border-0 hover:bg-[#f1f5f9]/90"
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
