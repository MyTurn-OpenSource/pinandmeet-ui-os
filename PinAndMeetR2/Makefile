# see https://cordova.apache.org/docs/en/latest/guide/cli/
install: platforms/android/build/outputs/apk/android-debug.apk
	adb install $<
platforms/android/build/outputs/apk/android-debug.apk:
	cordova build android
