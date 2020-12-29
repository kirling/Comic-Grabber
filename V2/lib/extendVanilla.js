"use strict";

Object.defineProperties( Array.prototype, {
    toNodeList: {
        /**
         * Converts Array object to NodeList object with filter.
         * @returns {NodeList}
         */
        value: function () {
            let fragment = document.createDocumentFragment();
            this.forEach( item => { if ( item instanceof Node ) { fragment.appendChild( item ); } });
            return fragment.childNodes;
        }
    }
} );

Object.defineProperties( String.prototype, {
    toFilename: {
        /**
         * Escape characters in String object for FileSystem
         * @returns {String}
         */
        value: function () {
            let decoder = document.createElement( "div" );
            decoder.innerHTML = this;

            return decoder.textContent
                .replace( /\.\.+/g, "⋯" )
                .replace( /!+/g, "！" )
                .replace( /\?+/g, "？" )
                .replace( /\/+/g, "／" )
                .replace( /\\+/g, "＼" )
                .replace( /:+/g, "：" )
                .replace( /~+/g, "∼" )
                .replace( /<+/g, "＜" )
                .replace( />+/g, "＞" )
                .replace( /\|+/g, "｜" )
                .replace( /\"+/g, "'" )
                .replace( /(！？)+！?/g, "⁉" )
                .replace( /？⁉|？！/g, "⁈" )
                .replace( /[\r\n\s]+/g, " " )
                .replace( /\u200b+/g, "" )
                .replace( /^[.\-~\s]*|[.\s]*$/g, "" )
        }
    }
} );

/**
 * @description DOM creation helper. It has static method only.
 * @typedef {String} propertyName - Property name of HTMLElement object.
 * @typedef {String} tagName - Tag name for creation of HTMLElement object.
 * @typedef {{ propertyName: (String|Number), _child: (Array<Node|HTMLStructure>|NodeList), _todo: (Function|Array<Function>) }} HTMLProperties
 * @typedef {{ tagName: (HTMLProperties) }} HTMLStructure
 * @typedef {{ tagName: Function}} HTMLPreset
 */
class HTML {
    /**
     * Create HTMLElement as passed HTMLStructure object
     * @param {HTMLStructure} structure
     * @param {HTMLPreset} preset
     * @returns {NodeList} Rendered DOM structure as NodeList
     */
    static render ( structure, preset = {} ) {
        if ( structure instanceof NodeList ) return structure;
        let fragment = document.createDocumentFragment();
        if ( structure instanceof Node ) { fragment.appendChild( structure ); }
        else if ( structure instanceof Object ) {
            let list;
            if ( !( structure instanceof Array ) ) { list = [ structure ]; }
            else { list = [ ...structure ]; }
            for ( const item of list ) {
                let node;
                if ( item instanceof Node ) { node = item; }
                else if ( typeof item === "string" ) { node = document.createTextNode( item ); }
                else if ( !( item instanceof Array ) && item instanceof Object ) {
                    const [[ name, attributes ]] = Object.entries( item );
                    if ( !( attributes._todo instanceof Array ) ) {
                        if ( attributes._todo instanceof Function ) attributes._todo = [ attributes._todo ];
                        else attributes._todo = [];
                    }
                    if ( name in preset ) {
                        attributes._todo.unshift( preset[name] );
                    }
                    node = this.setProperties( document.createElement( name ), attributes );
                }
                if ( node ) fragment.appendChild( node );
            }
        }

        return fragment.childNodes;
    }

    /**
     * Set properties on passed Node object
     * @param {Node} node
     * @param {HTMLProperties} properties 
     * @returns {Node} Same as passed and it has properties.
     */
    static setProperties ( node, properties ) {
        const children = this.render( properties._child );
        for ( const [ key, value ] of Object.entries( properties ) ) {
            switch ( key ) {
                case "_child":
                case "_todo": {
                    break;
                }
                case "Listeners": {
                    for ( const { type, listener, options } of value ) { node.addEventListener( type, listener, options || {} ); }
                    break;
                }
                case "dataset": {
                    Object.assign( node.dataset, value );
                    break;
                }
                case "style": {
                    node.style.cssText = value;
                    break;
                }
                default: {
                    switch ( typeof value ) {
                        case 'boolean': {
                            if ( value ) node.setAttributeNode( document.createAttribute( key ) );
                        }
                        default: {
                            node[ key ] = value;
                        }
                    }
                }
            }
        }
        if ( children.length ) { node.appendChildren( children ); }

        return ( properties._todo || [] )?.reduce( ( node, fn ) => ( fn instanceof Function ? fn( node ) : node ) , node ) || node;
    }

    /**
     * Remove Node from its parent node.
     * @param {Node} node - Node which will be removed.
     * @param {Boolean} uncover - When it is true, replace the target node with its child nodes before removing the target.
     * @returns {Node} Removed node.
     */
    static remove ( node, uncover = false ) {
        if ( !node.parentNode ) return null;
        if ( uncover ) {
            for ( let item of [ ...node.parentNode.childNodes ] ) {
                if ( item === node ) { node.parentNode.appendChildren( node.childNodes ); }
                else { node.parentNode.appendChild( item ); }
            }
        }
        return node.parentNode.removeChild( node );
    }
}

/**
 * @description Styled console logger with default style.
 * @typedef {{ log: (String), alert: (String), inform: (String) }} param Bundle of styles 
 * @typedef {String} $log - Style for normal log.
 * @typedef {String} $alert - Style for alert message.
 * @typedef {String} $inform - Style for information.
 * @returns Bundle of functions
 */
const
    $log = `font-size: 12px; color: rgba( 75, 223, 198, 0.75 );`,
    $alert = `font-size: 12px; color: rgba( 255, 32, 64, 1 );`,
    $inform = `font-size: 12px; color: rgba( 114, 20, 214, 0.75 );`;

class logger {
    constructor ( { log = $log, alert = $alert, inform = $inform } ) {
        this.log = log;
        this.alert = alert;
        this.inform = inform;
    }

    log ( message ) { console.log( `%c${message}`, this.log ); }
    alert ( message ) { console.log( `%c${message}`, this.alert ); }
    inform ( message ) { console.log( `%c${message}`, this.inform ); }

    static log ( message ) { console.log( `%c${message}`, $log ); }
    static alert ( message ) { console.log( `%c${message}`, $alert ); }
    static inform ( message ) { console.log( `%c${message}`, $inform ); }
}

function text2Blob ( text, type = "text/javascript" ) {
    return URL.createObjectURL( new Blob( [ text ], { type } ) );
}

export { HTML, logger, text2Blob };