"use strict";
import { genEx } from '/lib/constant.js';

async function removeAds ( method ) {
    let Ads = document.querySelectorAll( ".w_banner" );
    switch ( method ) {
        case "invisible": {
            for (let item of Ads ) item.style = "display: none !important;";
            break;
        }
        default: {
            for ( let item of Ads ) item.remove();
            break;
        }
    }
}
removeAds();

let pageModule = () => ( {
    moveNext: Promise.resolve( async function () { return document.querySelector( '.chapter_prev.fa-chevron-circle-right' )?.click(); } ),
    movePrev: Promise.resolve( async function () { return document.querySelector( '.chapter_prev.fa-chevron-circle-left' )?.click(); } ),
    info: ( async () => {
        let raw = document.head.querySelector( "meta[name=title]" )?.content.trim();
        let result = raw?.match( genEx )?.groups || {};
        return { ...result, raw };
    } )(),
    images: Promise.resolve( [ ...document.querySelectorAll( ".view-img img" ) ].map( item => item.src ) )
} );

export { pageModule };