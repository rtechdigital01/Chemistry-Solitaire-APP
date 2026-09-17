import http.server
import socketserver
import json
import csv
import random
import urllib.parse
import os

PORT = 8000
PUBLIC_DIR = "main/public"
DATASET_PATH = "Datasets/KS3_Master_Category_Bank.csv"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        
        # Intercept the API call
        if parsed_path.path == '/api/chemistry/board':
            self.handle_board_api(parsed_path)
            return
            
        # For all other paths, if there's no extension, append .html to match Laravel's behavior
        if '.' not in parsed_path.path and parsed_path.path != '/':
            self.path = parsed_path.path + '.html'
            if parsed_path.query:
                self.path += '?' + parsed_path.query

        return super().do_GET()
        
    def handle_board_api(self, parsed_path):
        query = urllib.parse.parse_qs(parsed_path.query)
        difficulty = query.get('difficulty', ['easy'])[0].lower()
        key_stage = query.get('key_stage', ['KS3'])[0].upper()
        deck = query.get('deck', ['periodic-table-groups'])[0]
        
        # Read the CSV
        categories = []
        try:
            with open(DATASET_PATH, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Filter by difficulty if present, else just take them
                    row_diff = row.get('Difficulty', '').lower()
                    if row_diff == difficulty or not difficulty:
                        cards_raw = row.get('Card Pool', '')
                        cards = [c.strip() for c in cards_raw.split(',') if c.strip()]
                        if len(cards) >= 4:
                            categories.append({
                                'id': row.get('S/N', str(random.randint(100, 999))),
                                'name': row.get('Category', 'Unknown'),
                                'difficulty': row.get('Difficulty', 'Easy'),
                                'icon_type': row.get('Icon Type', 'Element'),
                                'cards': cards
                            })
        except Exception as e:
            self.send_error(500, f"Error reading dataset: {e}")
            return
            
        if len(categories) < 4:
            self.send_response(422)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "Error",
                "message": "Not enough categories available for this difficulty."
            }).encode('utf-8'))
            return
            
        # Select 4 random categories
        selected_cats = random.sample(categories, 4)
        
        # Randomize cards inside categories
        board_categories = []
        for cat in selected_cats:
            pool = cat['cards']
            random.shuffle(pool)
            num_cards = random.randint(4, min(7, len(pool)))
            cat['cards'] = pool[:num_cards]
            board_categories.append(cat)
            
        response_data = {
            "status": "success",
            "message": "Game board generated successfully",
            "data": {
                "deck": deck,
                "key_stage": key_stage,
                "categories": board_categories
            }
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))


with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
    print(f"Mock server running at http://localhost:{PORT}")
    print(f"Serving static files from {PUBLIC_DIR}")
    print(f"Serving API at /api/chemistry/board via {DATASET_PATH}")
    httpd.serve_forever()
