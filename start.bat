@echo off
setlocal

set "version_file_path=src/.version"
set "dist_version_file_path=dist/.version"
set "version=1"
set "dist_version=0"

if exist "%version_file_path%" (
    < "%version_file_path%" (
        set /p version=
    )
)

if exist "%dist_version_file_path%" (
    < "%dist_version_file_path%" (
        set /p "dist_version=
    )
)

if "%version%"=="%dist_version%" (
    npm run start:prod
) else (
    npm run build
    npm run start:prod
)
endlocal
@pause