function init() {
    // console.log("Starting Initialization")
    document.addEventListener('scroll', (e) => scrollhandler(e));

    d3.select('#canvas')
    .append('rect').attr('x', 100).attr('y', 100).attr('height', 50).attr('width', 50)
}

function scrollhandler(event) {
    console.log(event);
}