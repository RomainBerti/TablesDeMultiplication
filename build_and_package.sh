#!/bin/bash

# 📌 Configuration
APP_NAME="Révision des tables"
VERSION="1.0"
APP_DISPLAY_NAME="$APP_NAME v$VERSION"
APP_FILENAME="$APP_NAME v$VERSION.app"
DMG_NAME="RévisionTables-v$VERSION.dmg"

# 🛠 1. Nettoyage préalable
echo "🧹 Nettoyage des anciens builds..."
rm -rf build dist "$DMG_NAME" tmp_dmg

# ⚙️ 2. Génération avec py2app
echo "⚙️ Génération de l'application..."
python setup.py py2app

# 📝 3. Renommage de l'app avec numéro de version
echo "📦 Renommage en : $APP_FILENAME"
mv "dist/$APP_NAME.app" "dist/$APP_FILENAME"

# 📁 4. Préparation du contenu du DMG
echo "📁 Création du dossier temporaire..."
mkdir -p tmp_dmg
cp -R "dist/$APP_FILENAME" tmp_dmg/

# 🧲 5. Ajout de l'alias Applications
echo "➕ Ajout de l'alias Applications"
osascript -e 'tell application "Finder" to make alias file to POSIX file "/Applications" at POSIX file "tmp_dmg/"'

# 💿 6. Création du .dmg
echo "💿 Création du fichier DMG : $DMG_NAME"
hdiutil create \
  -volname "$APP_DISPLAY_NAME" \
  -srcfolder "tmp_dmg" \
  -ov -format UDZO \
  "$DMG_NAME"

# 🧹 7. Nettoyage final
rm -rf tmp_dmg
echo "✅ Fichier DMG prêt : $DMG_NAME"