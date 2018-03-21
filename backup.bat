ECHO OFF
if "%1"=="" goto ERROR
c:\7zip\7za a -tzip -r C:\Users\nwe\Dropbox\Backups\PinAndMeetClientR2-%1.zip *.*
DIR C:\Users\nwe\Dropbox\Backups\PinAndMeetClientR2-%1.zip
GOTO OUT
:ERROR
ECHO ERROR: Zip file name missing. Example: backup MainPageDone
:OUT