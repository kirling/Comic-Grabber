"use strict";
let pageModule = async () => {
    let uri = document.URL;
    let { id, parent } = uri.match( /11toon.*?\/content\/(?<id>\d+)\/(?<parent>\d+)\?.*page=toon/ ).groups;
    let query = uri.replace( /#.+$/, "" ).split( "?" ).pop().split( "&" )
        .reduce( ( a, c, i, o ) => {
            let [ key, value ] = c.split( "=" ).map( i => decodeURIComponent( i ) );
            a[ key.toLowerCase() ] = value;
            return a;
        }, {} );
    
    let { data: { SucData: page } } = await ( await fetch( `/iapi/t5?id=${id}&parent=${parent}&page=toon` ) ).json();
    let result = query.subject?.match( /^(?<title>.+?|(?:[\(\[]?단편[\]?\)]?.+?))\s*(?<episode>(?:\d[.\d\s\-\~화권전후편]+|(?:번외|특별).+)|(?:\#\d+)|(stage\s*\d+))/i )?.groups || query.subject;
    let { file, imagelist } = page.Image;
    let { Next, Prev } = page.PrevNext;

    return {
        moveNext: Promise.resolve( async function () { return location.replace( `/content/${Next.ID}/${parent}?page=toon&subject=${Next.Subject}` ); } ),
        movePrev: Promise.resolve( async function () { return location.replace( `/content/${Prev.ID}/${parent}?page=toon&subject=${Prev.Subject}` ); } ),
        info: Promise.resolve( { raw: query.subject, ...result } ),
        images: Promise.resolve( JSON.parse( imagelist ).map( loc => `${file}${loc}` ) ),
    }
}

export { pageModule };