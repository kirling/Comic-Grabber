"use strict";
async function pageModule() {
    let images, contentRequest, infoRequest, pageJSON = JSON.parse( document.body.querySelector( '#__NEXT_DATA__' ).innerHTML );
    let User = {
        deviceId: pageJSON.props.initialState.common.constant.did,
        clientString: ( ( { name, osname } ) => `${osname} - ${name}` )( pageJSON.props.initialProps.userAgent )
    };
    
    let currentViewerKey = location.search.match( /[?&]?productId=(?<id>\d+)&?/ )?.groups.id;
    let singleForMeta = 
        pageJSON.props.initialState.viewer.viewers[currentViewerKey]?.singleForMeta ||
        pageJSON.props.initialState.product.productMap[currentViewerKey]?.singleForMeta;
    let { title, authorName, seriesTitle } = singleForMeta;
    
    let episode = title.replace( seriesTitle, "" ).toFilename();
    let raw = title.toFilename();
    title = `${seriesTitle} (${authorName})`.toFilename();
    
    infoRequest = ( function ( { props: { initialState } } ) {
        let form = new FormData();

        form.set( 'singlePid', currentViewerKey );
        form.set( 'seriesPid', singleForMeta.seriesId );
        form.set( 'deviceId', User.deviceId );

        return form;
    } )( pageJSON );

    contentRequest = ( function ( { props: { initialProps: { userAgent }, initialState } } ) {
        let form = new FormData();
        
        form.set( 'productId', currentViewerKey );
        form.set( 'device_mgr_uid', User.clientString );
        form.set( 'device_model', User.clientString );
        form.set( 'deviceId', User.deviceId );

        return form;
    } )( pageJSON );
    images = await fetch(
        "https://api2-page.kakao.com/api/v1/inven/get_download_data/web",
        { method: 'POST', body: contentRequest, credentials: "include" }
    )
    .then( response => response.json() )
    .then( json => json.downloadData.members.files.map( ( { secureUrl } ) => `${json.downloadData.members.sAtsServerUrl}${secureUrl}` ) );

    return {
        moveNext: Promise.resolve( async () => location.assign(
            await fetch( "https://api2-page.kakao.com/api/v5/inven/get_next_item", { method: 'POST', body: infoRequest, credentials: "include" } )
            .then( response => response.json() )
            .then( ( { item } ) => ( item ? `?${item.pid.replace( /^p/, "productId=")}` : '#It_is_lasest_episode' ) )
        ) ),
        movePrev: Promise.resolve( async () => location.assign(
            await fetch( "https://api2-page.kakao.com/api/v5/inven/get_prev_item", { method: 'POST', body: infoRequest, credentials: "include" } )
            .then( response => response.json() )
            .then( ( { item } ) => ( item ? `?${item.pid.replace( /^p/, "productId=")}` : '#It_is_oldest_episode' ) )
        ) ),
        info: { raw, title, episode },
        images,
    };
}

export { pageModule };