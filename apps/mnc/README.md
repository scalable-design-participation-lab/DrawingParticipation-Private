# To Start

npm install --global yarn

yarn install

yarn dev

# Notes

MNC was made by duplicating the restart-ukraine project and editing it, therefore there is lots of legacy code and files that are not being used.

# /stores - Data

apps/mnc/content/mncData.json - Where the data for MNC is pulled from
    TODO - Make sure link labels can be linked, Merge this data from the spreadsheet.
    TODO - Split up link lables for "The Health Wagon: Mobilizing Healthcare in Rural Virginia"

apps/mnc/app/stores/types/store.ts -- We use Features from base and ammend it with properties specific to MNC, defined here.
    TODO - Add the links and the link lables to properties from apps/mnc/content/mncLinks.csv

apps/mnc/app/stores/db.ts -- Features are create here, and icons are assigned here. 

# mnc/components

apps/mnc/app/components/BackgroundMap.vue -- The main map of the app. Builds instance of quick look and info popup component. Handles opening and closing the quick look and info popup. Generalized map calls open quick look. 
    TODO - Quick look needs to move with the icon when the map moves

apps/mnc/app/components/infoPopup.vue -- The expanded view. Uses UCard, UBadge components from React library.
    TODO - Follow the UI design in the Figma
    TODO - Add the tags
    TODO - Make the links clickable
    TODO - Attach the captions to the image.
    TODO - Make the image a carasoul. 

apps/mnc/app/components/QuickLook.vue -- The tiny view.

# base/components

base/app/components/DrawingLayer/DrawingLayer.vue - For this project, its main role is placing icons on the map. 
    TODO - The icons need to be fiddled with to resolve the following issues:
        * Icons are too big
        * Clear icons are hard to understand
        * What to do when there are 2 icons in the same location - Pakistan
        * Icons only click on the bottom left side, rather than anywhere on the icon.

# MVP TODOS
* connect to firebase
* bottom toolbar 
* filter functionality
* add mnc solutions functionality