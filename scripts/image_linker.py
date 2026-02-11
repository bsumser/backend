# ~/backend/scripts/image_linker_full.py

# ~/backend/scripts/image_linker_full.py

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

# Read variables using the names from your database.env file
DB_HOST = os.environ.get('DO_HOST')
DB_NAME = os.environ.get('DO_DB_NAME')
DB_USER = os.environ.get('DO_USER')
DB_PASSWORD = os.environ.get('DO_PASSWORD')
DB_PORT = os.environ.get('DO_PORT', '5432')

# DigitalOcean Spaces Config
SPACES_ENDPOINT = os.environ.get('DO_SPACES_ENDPOINT', 'https://mtg-image.sfo3.digitaloceanspaces.com').rstrip('/')
SPACES_FOLDER = os.environ.get('DO_SPACES_FOLDER', 'mtg-image')

def sanitize_filename_part(name_part):
    """Sanitizes a string for use in a filename, keeping spaces."""
    if not name_part: return "unknown"
    s = str(name_part).strip().replace(' // ', '_--_')
    s = re.sub(r'[<>:"/\\|?*]', '_', s)
    return s

def link_all_images():
    """
    Scans the entire database for card printings with a scryfallid, 
    constructs a DO Spaces URL, and updates the card_images table.
    """
    required_vars = ['DO_HOST', 'DO_DB_NAME', 'DO_USER', 'DO_PASSWORD']
    if not all(os.environ.get(v) for v in required_vars):
        print("Error: Missing one or more required environment variables in your database.env file.")
        sys.exit(1)

    print("Starting full image linking process for entire collection...")

    conn = None
    processed_count = 0
    
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT)
        print("Successfully connected to the PostgreSQL database.")
        cur = conn.cursor()

        # Query to find ALL card printings with a scryfallid
        query = """
            SELECT cards.id, cards.name, ci.scryfallid
            FROM cards
            JOIN cardidentifiers AS ci ON cards.id = ci.id
            WHERE ci.scryfallid IS NOT NULL;
        """

        print("Executing query to find all card printings...")
        cur.execute(query)
        all_card_printings = cur.fetchall()

        if not all_card_printings:
            print("Could not find any cards with a scryfallid in the database.")
            return

        total_to_process = len(all_card_printings)
        print(f"Found {total_to_process} card printings to process.")

        for index, (card_id, card_name, scryfall_id) in enumerate(all_card_printings):
            # Log progress every 1000 cards
            if (index + 1) % 1000 == 0:
                print(f"  Processed {index + 1} of {total_to_process} cards...")
                conn.commit() # Periodic commit for safety in large batches

            # Construct filenames and URLs
            sanitized_name = sanitize_filename_part(card_name.split(' // ')[0])
            image_filename = f"{sanitized_name}_{scryfall_id}.jpg"
            
            # quote() handles the spaces by converting them to %20
            encoded_filename = quote(image_filename)
            image_url = f"{SPACES_ENDPOINT}/{SPACES_FOLDER}/{encoded_filename}"

            # Upsert into card_images table
            insert_query = """
                INSERT INTO card_images (card_id, image_filename, image_url, image_type)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (card_id, image_filename) 
                DO UPDATE SET image_url = EXCLUDED.image_url
                RETURNING id;
            """
            
            try:
                cur.execute(insert_query, (card_id, image_filename, image_url, 'normal'))
                if cur.fetchone():
                    processed_count += 1
            except psycopg2.Error as e:
                print(f"  Database Error for {image_filename}: {e}")
                conn.rollback() 

        conn.commit() 
        cur.close()

    except psycopg2.Error as e:
        print(f"\n--- A database error occurred: {e}")
        if conn: conn.rollback()
    except Exception as e:
        print(f"\n--- An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()
            print("\nDatabase connection closed.")

    print("\n====== Full Linking Process Summary ======")
    print(f"Successfully processed {processed_count} image links.")
    print("Run complete.")
    print("=========================================")

if __name__ == "__main__":
    link_all_images()