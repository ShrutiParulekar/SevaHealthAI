import pandas as pd
from bs4 import BeautifulSoup
import re

# Read the HTML file
with open('hospital_info.html', 'r', encoding='utf-8') as file:
    html_content = file.read()

# Parse HTML with BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Find the main table
table = soup.find('table', {'id': 'myTable'})

# Initialize lists to store data
data = []

# Find all table rows (excluding header)
rows = table.find_all('tr')

# Skip the first row (header)
for row in rows[1:]:
    # Get all td elements
    cells = row.find_all('td')
    
    if len(cells) > 0:
        # Extract data from each cell
        row_data = {}
        
        # S.No (index 0)
        row_data['S.No'] = cells[0].get_text(strip=True)
        
        # Hospital ID and Specialties (index 1)
        hospital_id_cell = cells[1]
        hospital_id_link = hospital_id_cell.find('a')
        
        if hospital_id_link:
            row_data['Hospital_ID'] = hospital_id_link.get_text(strip=True)
            
            # Extract specialties from title attribute
            title_attr = hospital_id_link.get('title', '')
            if 'Specialties are:' in title_attr:
                # Extract specialties text after "Specialties are:"
                specialties_text = title_attr.split('Specialties are:')[1].strip()
                # Split by newlines and clean up
                specialties_list = [s.strip() for s in specialties_text.split('\n') if s.strip()]
                row_data['Specialties'] = ', '.join(specialties_list)
            else:
                row_data['Specialties'] = ''
        else:
            row_data['Hospital_ID'] = hospital_id_cell.get_text(strip=True)
            row_data['Specialties'] = ''
        
        # Hospital Display Code (index 2)
        row_data['HOSP_DISP_CODE'] = cells[2].get_text(strip=True) if len(cells) > 2 else ''
        
        # District (index 3)
        row_data['District'] = cells[3].get_text(strip=True) if len(cells) > 3 else ''
        
        # Taluka (index 4)
        row_data['Taluka'] = cells[4].get_text(strip=True) if len(cells) > 4 else ''
        
        # Hospital Name (index 5)
        row_data['Hospital_Name'] = cells[5].get_text(strip=True) if len(cells) > 5 else ''
        
        # Address (index 6) - Extract from JavaScript function
        if len(cells) > 6:
            address_cell = cells[6]
            address_link = address_cell.find('a')
            if address_link:
                onclick_attr = address_link.get('href', '')
                # Extract address from JavaScript function viewAddress('ADDRESS_TEXT','HOSPITAL_ID')
                match = re.search(r"viewAddress\('([^']*)'", onclick_attr)
                if match:
                    row_data['Address'] = match.group(1).strip()
                else:
                    row_data['Address'] = address_cell.get_text(strip=True)
            else:
                row_data['Address'] = address_cell.get_text(strip=True)
        else:
            row_data['Address'] = ''
        
        # Pincode (index 7)
        row_data['Pincode'] = cells[7].get_text(strip=True) if len(cells) > 7 else ''
        
        # MCO Contact Number (index 8)
        row_data['MCO_Contact_Number'] = cells[8].get_text(strip=True) if len(cells) > 8 else ''
        
        # Email (index 9)
        row_data['Email'] = cells[9].get_text(strip=True) if len(cells) > 9 else ''
        
        # Only add rows that have actual data (skip empty rows)
        if row_data['S.No']:
            data.append(row_data)

# Create DataFrame
df = pd.DataFrame(data)

# Clean the data
# Remove extra whitespace
for col in df.columns:
    if df[col].dtype == 'object':
        df[col] = df[col].str.strip()

# Clean Address field - remove extra commas and spaces
df['Address'] = df['Address'].str.replace(r'\s+', ' ', regex=True)
df['Address'] = df['Address'].str.replace(r',+', ',', regex=True)
df['Address'] = df['Address'].str.strip(',').str.strip()

# Clean Hospital Name
df['Hospital_Name'] = df['Hospital_Name'].str.replace(r'\s+', ' ', regex=True)

# Convert S.No to integer
df['S.No'] = pd.to_numeric(df['S.No'], errors='coerce')

# Display basic information
print("DataFrame Shape:", df.shape)
print("\nFirst few rows:")
print(df.head())
print("\nColumn names:")
print(df.columns.tolist())
print("\nData types:")
print(df.dtypes)
print("\nBasic statistics:")
print(df.describe())

# Check for missing values
print("\nMissing values:")
print(df.isnull().sum())

# Save to paraquet file
df.to_parquet('hospital_data.parquet', index=False)
print("\nData saved to 'hospital_data.parquet'")
