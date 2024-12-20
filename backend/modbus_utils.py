def generate_crc16_table():
    """Generate a CRC-16 lookup table."""
    table = []
    for i in range(256):
        crc = 0
        c = i
        for j in range(8):
            if (crc ^ c) & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc = crc >> 1
            c = c >> 1
        table.append(crc)
    return table

def calculate_crc(data: bytes, table) -> int:
    """Calculate CRC-16 for given data using pre-generated table."""
    crc = 0xFFFF
    for byte in data:
        crc = (crc >> 8) ^ table[(crc ^ byte) & 0xFF]
    return crc