import json
import re
from difflib import SequenceMatcher
from typing import Dict, List, Any, Union
from collections import Counter

class AISPortMatcher:
    def __init__(self, locode_file: str = "locode.json"):
        """Initialize with UN/LOCODE database."""
        with open(locode_file, 'r') as f:
            self.locode_data = json.load(f)
        
        # Build indexes for faster searching
        self.locode_index = {port['locode']: port for port in self.locode_data}
        self.port_name_index = {}
        self.country_index = {}
        self.port_code_index = {}
        self.country_name_index = {}
        
        for port in self.locode_data:
            # Index by port name (normalized)
            port_name_norm = port['port'].upper()
            if port_name_norm not in self.port_name_index:
                self.port_name_index[port_name_norm] = []
            self.port_name_index[port_name_norm].append(port)
            
            # Index by country code
            cc = port['countryCode'].upper()
            if cc not in self.country_index:
                self.country_index[cc] = []
            self.country_index[cc].append(port)
            
            # Index by country name
            country_norm = port['country'].upper()
            if country_norm not in self.country_name_index:
                self.country_name_index[country_norm] = []
            self.country_name_index[country_norm].append(port)
            
            # Index by port code
            pc = port['portCode'].upper()
            if pc not in self.port_code_index:
                self.port_code_index[pc] = []
            self.port_code_index[pc].append(port)
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for matching."""
        return text.upper().strip()
    
    def _remove_noise(self, text: str) -> str:
        """Remove known noise words and symbols."""
        noise_words = [
            'TBA', 'ANCH', 'ANCHORING', 'BUNKERING', 'OPL', 'OPEN', 'IN ORDER', 'FOR ORDER', 'FOR ORDERS',
            'ORDERS', 'ORDER', 'UNKNOWN', 'N/A', 'NONE', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'ANCHORAGE', 'AWAITING'
        ]
        
        text = text.upper()
        # Remove anything in brackets
        text = re.sub(r'\([^)]*\)', '', text)
        # Remove all special symbols and replace with space
        text = re.sub(r'[<>=>|/\\._\-"\'`~!@#$%^&*()[\]{}:;]', ' ', text)
        # Remove noise words
        for noise in noise_words:
            text = re.sub(rf'\b{noise}\b', '', text)
        # Clean up extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _extract_destination_from_route(self, text: str) -> str:
        """Extract destination from 'from -> to' format."""
        arrows = ['<>', '>>', '-->', '=>', '===', '->', '>']
        
        for arrow in arrows:
            if arrow in text:
                parts = text.split(arrow)
                if len(parts) > 1:
                    return parts[-1].strip()
        
        if re.search(r'\bTO\b', text, re.IGNORECASE):
            parts = re.split(r'\bTO\b', text, flags=re.IGNORECASE)
            if len(parts) > 1:
                return parts[-1].strip()
        
        return text
    
    def _extract_country(self, text: str) -> tuple:
        """Extract country and remaining text from input."""
        text = text.strip()
        separators = r'[,\-./\s]+'
        parts = [p.strip() for p in re.split(separators, text) if p.strip()]
        
        if len(parts) < 2:
            return None, text
        
        # Check if last part is a country name or code
        potential_country = parts[-1]
        
        # Check against country names
        if potential_country.upper() in self.country_name_index:
            port_part = ' '.join(parts[:-1])
            return potential_country.upper(), port_part
        
        # Check against country codes
        if len(potential_country) == 2 and potential_country.upper() in self.country_index:
            port_part = ' '.join(parts[:-1])
            return potential_country.upper(), port_part
        
        # Check if first part is country (for cases like "INDIA, KOCHI")
        if parts[0].upper() in self.country_name_index:
            port_part = ' '.join(parts[1:])
            return parts[0].upper(), port_part
        
        return None, text
    
    def _fuzzy_match_port_name(self, name: str, country_filter: str = None, threshold: float = 0.75) -> List[Dict]:
        """Fuzzy match port name against database."""
        matches = []
        name_upper = name.upper()
        
        search_space = self.locode_data
        if country_filter:
            # Filter by country if specified
            if country_filter in self.country_name_index:
                search_space = self.country_name_index[country_filter]
            elif country_filter in self.country_index:
                search_space = self.country_index[country_filter]
        
        for port in search_space:
            port_name = port['port'].upper()
            similarity = SequenceMatcher(None, name_upper, port_name).ratio()
            
            # Also check if the search term is contained in port name
            if name_upper in port_name:
                similarity = max(similarity, 0.85)
            
            if similarity >= threshold:
                matches.append((port, similarity))
        
        # Sort by similarity descending
        matches.sort(key=lambda x: x[1], reverse=True)
        return [m[0] for m in matches]
    
    def _is_locode(self, text: str) -> bool:
        """Check if text matches LOCODE format (2 letter country + 3 letter port code)."""
        text = text.upper().replace(' ', '').replace('-', '')
        
        # Must be exactly 5 characters, 2 letters + 3 letters
        if not (len(text) == 5 and text[:2].isalpha() and text[2:].isalpha()):
            return False
        
        # Verify it actually exists in the LOCODE index
        if text in self.locode_index:
            return True
        
        return False
    
    def _is_country_code(self, text: str) -> bool:
        """Check if text is a valid country code."""
        return len(text) == 2 and text.upper() in self.country_index
    
    def _is_port_code_only(self, text: str) -> bool:
        """Check if text is exactly a port code (3 letters)."""
        text = text.upper().replace(' ', '').replace('-', '')
        return len(text) == 3 and text.isalpha()
    
    def _format_response(self, port: Dict, reported_destination: str = "", matched: bool = True) -> Dict:
        """Format response for a matched port."""
        if matched:
            return {
                "reportedDestination": reported_destination,
                "locode": port['locode'],
                "port": port['port'],
                "country": port['country'],
                "lat": port['lat'],
                "lon": port['lon'],
                "matched": True
            }
        else:
            return {"matched": False}

    
    def _format_unmatched(self, input_text: str) -> Dict:
        """Format unmatched response."""
        return {
            "reportedDestination": input_text,
            "matched": False
        }
    
    # Main Function
    def match_destination(self, destination: str) -> Union[Dict, List[Dict]]:
        """Main function to match destination against UN/LOCODE database."""
        if not destination or not isinstance(destination, str):
            return self._format_unmatched("")
        
        original_input = destination
        destination = destination.strip()
        
        # Check for pure noise
        noise_only = ['TBA', 'ANCH', 'UNKNOWN', 'N/A', 'NONE', 'IN ORDER', 'FOR ORDER', 'FOR ORDERS', 'ORDERS', 'ORDER', 'ANCHORAGE']
        if destination.upper() in noise_only:
            return self._format_unmatched(original_input)
        
        # Step 1: Extract destination from route format
        destination = self._extract_destination_from_route(destination)
        
        # Step 2: Remove noise
        cleaned = self._remove_noise(destination)
        
        if not cleaned:
            return self._format_unmatched(original_input)
        
        # Step 3: Check if cleaned text exists as exact port name FIRST (highest priority)
        cleaned_upper = self._normalize_text(cleaned)
        if cleaned_upper in self.port_name_index:
            return self._format_response(self.port_name_index[cleaned_upper][0], original_input)
        
        # Step 4: Extract country information
        country_filter, port_text = self._extract_country(cleaned)
        
        # Step 5: If we extracted country info, check for exact port name within that country FIRST
        if country_filter:
            port_upper = self._normalize_text(port_text)
            
            # Get the country code for filtering
            country_code = None
            if country_filter in self.country_name_index:
                for port in self.country_name_index[country_filter]:
                    country_code = port['countryCode']
                    break
            elif country_filter in self.country_index:
                country_code = country_filter
            
            # Try exact port name match within country BEFORE trying LOCODE
            if country_code:
                for port in self.locode_data:
                    if port['countryCode'] == country_code and port['port'].upper() == port_upper:
                        return self._format_response(port, original_input)
        
        # Step 6: Try exact LOCODE match only if not found as port name
        if self._is_locode(cleaned):
            locode_clean = cleaned.upper().replace(' ', '').replace('-', '')
            if locode_clean in self.locode_index:
                return self._format_response(self.locode_index[locode_clean], original_input)
        
        # Step 5: If we have a country, search within that country first
        if country_filter:
            port_upper = self._normalize_text(port_text)
            
            # Get the country code for filtering
            country_code = None
            if country_filter in self.country_name_index:
                country_code = self.locode_data[0]['countryCode']  # Will refine below
                for port in self.country_name_index[country_filter]:
                    country_code = port['countryCode']
                    break
            elif country_filter in self.country_index:
                country_code = country_filter
            
            # Try exact port name match within country
            if country_code:
                for port in self.locode_data:
                    if port['countryCode'] == country_code and port['port'].upper() == port_upper:
                        return self._format_response(port, original_input)
                
                # Try fuzzy match within country with high threshold
                fuzzy_matches = self._fuzzy_match_port_name(port_text, country_filter=country_code, threshold=0.75)
                if fuzzy_matches:
                    return self._format_response(fuzzy_matches[0], original_input)
                
                # Try fuzzy match within country with lower threshold
                fuzzy_matches = self._fuzzy_match_port_name(port_text, country_filter=country_code, threshold=0.65)
                if fuzzy_matches:
                    return self._format_response(fuzzy_matches[0], original_input)
        
        # Step 6: Try exact port name match globally
        port_upper = self._normalize_text(cleaned)
        if port_upper in self.port_name_index:
            return self._format_response(self.port_name_index[port_upper][0], original_input)
        
        # Step 7: Check if port name partially matches (contains match)
        for port_name, ports in self.port_name_index.items():
            if port_upper in port_name or port_name in port_upper:
                return self._format_response(ports[0], original_input)
        
        # Step 8: Try fuzzy matching on port name with high threshold
        fuzzy_matches = self._fuzzy_match_port_name(cleaned, threshold=0.80)
        if fuzzy_matches:
            return self._format_response(fuzzy_matches[0], original_input)
        
        # Step 9: Try port code only (exactly 3 letters, must be exact match)
        if self._is_port_code_only(cleaned):
            port_code_clean = cleaned.upper().replace(' ', '').replace('-', '')
            if port_code_clean in self.port_code_index:
                matches = self.port_code_index[port_code_clean]
                if len(matches) == 1:
                    return self._format_response(matches[0], original_input)
                else:
                    # Return list of all matches for port code
                    return [self._format_response(m, original_input) for m in matches]
        
        # Step 10: Fuzzy match with medium threshold
        fuzzy_matches = self._fuzzy_match_port_name(cleaned, threshold=0.70)
        if fuzzy_matches:
            return self._format_response(fuzzy_matches[0], original_input)
        
        # No match found
        return self._format_unmatched(original_input)


# # Example usage
# if __name__ == "__main__":
#     matcher = AISPortMatcher("locode.json")
    
#     test_cases = [
#         # a) Simple LOCODE
#         "TRTUZ",
#         "KRINC",
        
#         # b) LOCODE with spaces or hyphens
#         "AE FJR",
#         "BR PNG",
#         "CA-VAN",
        
#         # c) Port name only
#         "PORT SAID",
        
#         # d) Port and country
#         "LAGOS NIGERIA",
#         "DAMPIER, AUSTRALIA",
#         "ARATU. BRAZIL",
#         "PORTLAND-USA",
#         "MONTEVIDEO UYMVD",
#         "INDIA, KOCHI",
        
#         # e) Route format
#         "BEZEE <> GBHUL",
#         "LYBEN>>MTMAR",
#         "MXDBT --> USPOA",
#         "SGSIN=>BRPMA",
#         "MUPLU>USHOU",
#         '"===BS FPO',
#         "JPMIZ TO CNZOS",
        
#         # f) Pure noise
#         "TBA",
#         "UNKNOWN",
        
#         # g) Noise with ports
#         "GIBRALTAR EAST ANCH",
#         "FUJAIRAH BUNKERING",
#         "GALLE- FOR ORDER",
#         "AEFJR FOR ORDERS",
#         "BRAZIL FOR ORDERS",
        
#         # h) Bracket noise
#         "SG SIN (ANCHORAGE)",
#         "ALGECIRAS (OPL)",
        
#         # j) Port code only
#         "MAA",
        
#         # k) Multiple spaces and mixed separators
#         "SHANGHAI   CHINA",
#         "ANTWERP/BELGIUM",
#         "HOUSTON_USA",
#         "ROTTERDAM - NETHERLANDS",
        
#         # n) Partial country names
#         "SANTOS BR",
#         "HAMBURG DE",
        
#         # o) Multiple route separators (malformed)
#         "AUHIR=>CNSHA=>JPTYO",
#         "PORTSA<>BRRIO<>USNYC",

#         # q) Mix of LOCODE and port name in route
#         "CNSHA PORT OF SHANGHAI",
#         "ROTTERDAM NLRTM",
        
#         # s) Misspellings/typos
#         "SINGAPROE",
#         "SHNAGHAI",
#         "ROTREDAM",
        
#         # u) Empty and minimal
#         "",
#         "   ",
#         "A",
#     ]
    
#     for test in test_cases:
#         result = matcher.match_destination(test)
#         print(f"Input: {test}")
#         print(f"Output: {json.dumps(result, indent=2)}")
#         print("-" * 60)

