from setuptools import setup

APP = ['main.py']
APP_NAME = 'Révision des tables'
VERSION = '1.0'
DATA_FILES = ['results.json', 'results_addition.json']

OPTIONS = {
    'argv_emulation': True,
    'iconfile': 'app_icon.icns',
    'includes': ['tkinter'],
    'resources': DATA_FILES,
    'plist': {
        'CFBundleName': f'{APP_NAME} v{VERSION}',
        'CFBundleShortVersionString': VERSION,
        'CFBundleVersion': VERSION,
    },
}

setup(
    app=APP,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)