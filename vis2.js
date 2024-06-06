function init() {
    var chart = RadarChart.chart();
    var svg = d3.select('#chart').append('svg')
    .attr('width', 600)
    .attr('height', 800);

    // draw one
    svg.append('g').classed('focus', 1).datum(data).call(chart);

    // draw many radars
    var game = svg.selectAll('g.game').data(
    [
        data,
        data,
        data,
        data
    ]
    );
    game.enter().append('g').classed('game', 1);
    game
    .attr('transform', function(d, i) { return 'translate(150,600)'; })
    .call(chart);
}
window.onload = init;
