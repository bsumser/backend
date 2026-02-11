# ~/backend/scripts/image_linker_goldspan_test.py

import os
import re
import sys
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from urllib.parse import quote

# --- Configuration ---
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
ENV_FILE_PATH = os.path.join(project_root, 'database.env')

if os.path.exists(ENV_FILE_PATH):
    print(f"Loading environment variables from: {ENV_FILE_PATH}")
    load_dotenv(dotenv_path=ENV_FILE_PATH)
else:
    print(f"Warning: Environment file not found at '{ENV_FILE_PATH}'.")

# Database Config
DB_HOST = os.environ.get('DO_HOST')
DB_NAME = os.environ.get('DO_DB_NAME')
DB_USER = os.environ.get('DO_USER')
DB_PASSWORD = os.environ.get('DO_PASSWORD')
DB_PORT = os.environ.get('DO_PORT', '5432')

# DigitalOcean Spaces Config
# Example: https://your-bucket-name.nyc3.digitaloceanspaces.com
SPACES_ENDPOINT = os.environ.get('DO_SPACES_ENDPOINT') 
# Optional: if you store images in a subfolder inside the bucket
SPACES_FOLDER = os.environ.get('DO_SPACES_FOLDER', 'mtg_images') 

def sanitize_filename_part(name_part):
    """Sanitizes a string for use in a filename, matching your S3 naming."""
    if not name_part: return "unknown"
    s = str(name_part).strip().replace(' // ', '_--_')
    s = re.sub(r'[<>:"/\\|?*]', '_', s)
    return s

def link_goldspan_dragon_images():
    required_vars = ['DO_HOST', 'DO_DB_NAME', 'DO_USER', 'DO_PASSWORD', 'DO_SPACES_ENDPOINT']
    if not all(os.environ.get(v) for v in required_vars):
        print("Error: Missing required environment variables (DB or Spaces config).")
        sys.exit(1)
    endpoint = os.environ.get('DO_SPACES_ENDPOINT', 'https://mtg-image.sfo3.digitaloceanspaces.com').rstrip('/')
    folder = os.environ.get('DO_SPACES_FOLDER', 'mtg-image')

    print("Starting URL linking process for 'Goldspan Dragon'...")

    conn = None
    inserted_count = 0

    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT)
        cur = conn.cursor()

        # We select the 'id' which is your primary key for the 'cards' table
        query = """
            SELECT cards.id, cards.name, ci.scryfallid
            FROM cards
            JOIN cardidentifiers AS ci ON cards.id = ci.id
            WHERE cards.name = 'Goldspan Dragon'
              AND ci.scryfallid IS NOT NULL;
        """
        cur.execute(query)
        cards_to_link = cur.fetchall()

        print(f"cards to link:\n {cards_to_link}\n")

        for card_id, card_name, scryfall_id in cards_to_link:
            sanitized_name = sanitize_filename_part(card_name.split(' // ')[0])
            image_filename = f"{sanitized_name}_{scryfall_id}.jpg"
    
            # URL-encode the filename to handle spaces and special characters
            # safe='' ensures that even spaces are encoded to %20
            encoded_filename = quote(image_filename)
    
            # Construct the full URL using the encoded filename
            image_url = f"{endpoint}/{folder}/{encoded_filename}"

            insert_query = """
                INSERT INTO card_images (card_id, image_filename, image_url, image_type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (card_id, image_filename) 
                DO UPDATE SET image_url = EXCLUDED.image_url;
            """

            cur.execute(insert_query, (card_id, image_filename, image_url, 'normal'))
    
        conn.commit()
        cur.close()

    except Exception as e:
        print(f"\n--- An error occurred: {e}")
        if conn: conn.rollback()
    finally:
        if conn:
            conn.close()

    print(f"\nSummary: Linked {inserted_count} images to DigitalOcean URLs.")

if __name__ == "__main__":
    link_goldspan_dragon_images()