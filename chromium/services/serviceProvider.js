"use strict";
function imports ( list = [] ) {
    let promises = [];
    for ( const module of list ) promises.push( import( module ) );

    return Promise.all( promises );
}

async function main () {
    async function downloadImages ( { filename, conflictAction = "overwrite", images, uri } ) {
        let list = await Promise.all( images.map( uri => fetch( uri ).then( response => response.blob() ) ) );
        let zip = new JSZip();
        await Promise.all( list.map( async ( blob, n ) => zip.file( `${n.toString().padStart( 3, "0" )}0.${await getExtension( blob )}`, blob ) ) );
        zip.file( 'Downloaded from.txt', text2Blob( uri, "text/plain" ) );
        let url = URL.createObjectURL( await zip.generateAsync( { type: "blob" } ) );
        
        return $client.dl.download( { url, filename, conflictAction } )
            .then( id => new Promise( resolve => {
                function onComplete ( item ) {
                    if ( item.id === id && item.state ) {
                        switch ( item.state.current ) {
                            case "interrupted":
                            case "complete": {
                                $client.dl.onChanged.removeListener( onComplete );
                                URL.revokeObjectURL( url );
                                resolve( { result: item.state.current, filename } );
                                break;
                            }
                            default:
                        }
                    }
                }
                $client.dl.onChanged.addListener( onComplete );
            } ) )
            .catch( msg => ( { result: "Invalid filename", filename } ) )
    }

    const [ { $client }, { logger, text2Blob, uid }, { constant }, {} ]
    = await imports( [
        "/lib/browserUnifier.js",
        "/lib/extendVanilla.js",
        "/lib/constant.js",
        "/3rdParty/jszip.js"
    ] );

    $client.runtime.onMessage.addListener(
        async ( { message, action, clientUid, data }, sender ) => {
            let result = undefined;
            switch ( action ) {
                case constant.__download__: {
                    result = await downloadImages( data ).catch( data => data );
                    break;
                }
            }
            $client.tabs.sendMessage( sender.tab.id, { action, clientUid, data: result } );
        }
    );

    $client.browserAction.onClicked.addListener( function ( tab ) { $client.tabs.sendMessage( tab.id, { action: "toggleMode" } ); } );
    
    return { message: "Scheduled task completed successfully. Waiting user action.", log: logger.log };
}

async function getExtension ( blob ) {
    switch ( blob.type ) {
        case "image/x-icon":
        case "image/vnd.microsoft.icon": { return "ico"; }
        case "image/tiff": { return ".tif"; }
        case "image/svg+xml": { return "svg"; }
        case "image/jpeg": { return "jpg"; }
        case "application/octet-stream": {
            const signatures = {
                "png": /89504e470d0a1a0a/i,
                "jpg": /ffd8ff(db|ee)|ffd8ffe(000104a4649460001|1.{4,4}457869660000)/i,
                "gif": /474946383(7|9)61/i,
                "tif": /49492a00|4d4d002a/i,
                "bmp": /424d/i,
                "psd": /38425053/i,
                "webp": /52494646.{8,8}57454250/i,
            };
            const binSign = ( new Uint8Array( await blob.slice( 0, 24 ).arrayBuffer() ) )
                .reduce( ( hex, bin ) => hex + bin.toString( 16 ).padStart( 2, "0" ), "" );
            console.log( binSign );
            return Object.entries( signatures ).find( ( [ , hexHeader ] ) => binSign.match( hexHeader ) )?.[0] || blob.type;
        }
        default: { return blob.type.split( "/" ).pop(); }
    }

}

main()
    .then( ( { message, log } ) => log( message ) )
    .catch( error => console.log( "Something goes wrong.\r\nPlease, contact the developer ( dev@isitea.net ).", error ) );