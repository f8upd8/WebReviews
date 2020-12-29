import vimeo

access_token = '26e5f3c77deee27aef4527064f22fb7a'
client_id = 'e30ccfcaf4cb41cf6e271221d87116a6bb47597d'
client_secret = 'JS6xdc4D5ClY0sMv2u1C1PI6QKHa3Xfu0gWtakiFxJmwghv0IQkbZ+e/I3A4DSacSJ5rPxyVSR6r2rBYojgIhswngRjV1+rH+UJyrf+A3RbUcelzPGHNINegvdLZAqSb'

def upload(path, name, desc):
    client = vimeo.VimeoClient(
        token=f'{access_token}',
        key=f'{client_id}',
        secret=f'{client_secret}'
        )

    uri = client.upload(path, data={
    'name': f'{name}',
    'description': f'{desc}',
    'chunk_size': 512 * 1024
    })

    print(uri)