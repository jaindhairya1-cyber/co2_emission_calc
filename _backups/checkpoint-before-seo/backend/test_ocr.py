import io
import httpx
from PIL import Image, ImageDraw

def test_ocr():
    img = Image.new('RGB', (400, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 20), "ELECTRICITY TARIFF INVOICE", fill=(0, 0, 0))
    d.text((20, 60), "Consumer: ABC Textiles Ltd", fill=(0, 0, 0))
    d.text((20, 100), "Metered Consumption: 12500 kWh", fill=(0, 0, 0))
    d.text((20, 140), "Total Payable: INR 87,500", fill=(0, 0, 0))
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    files = {'file': ('sample_electricity_bill.png', img_bytes, 'image/png')}
    data = {'session_id': 'TEMP-MSME-8492', 'business_name': 'ABC Textiles'}

    with httpx.Client(timeout=45.0) as client:
        response = client.post('http://127.0.0.1:8000/api/bills/upload-ocr', files=files, data=data)
        print("Status:", response.status_code)
        import json
        print("Response:", json.dumps(response.json(), indent=2))

if __name__ == '__main__':
    test_ocr()
