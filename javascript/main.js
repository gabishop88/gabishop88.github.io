const num_scenes = 3;
const scroll_dist = 500;
const margin = 50;
const height = 600;
const r = 8;
var scroll = 0;
var current_scene = 0;
var data = [];
var geodata = null;
var geojson = null;

/** Initializes the page. Gathers data, and shows starting scene
 * 
 *  Layout Plan - Martini glass
 *   - Scene 1: Scatterplot with water access versus income, shouldn't be much of a surprise, but should give contex for what I am trying to show
 *   - Scene 2: Scatterplot with water access versus some other metric, maybe health or access to sanitation. Should narrow in on the issue or some bullshit like that
 *   - Scene 3: Map showing all countries with data available. Color is determined by access to water, and clicking should give access to organizations to donate to.
 * 
 *  TODO: 
 *   - Create indicators to show where you can scroll
 *   - Improve the number of countries with data
 *   - Decide whether it is a good idea to use a global var for data, since I am using set_scene()
 */
async function init() {
    document.addEventListener('mousewheel', (e) => handlescroll(e));
    document.addEventListener('mousemove',  (e) => handlemove(e));
    d3.select('svg').append('g').attr('transform', `translate(${margin},${margin})`).attr('id', 'data')
    await load_data();
    set_scene(-1);
}


/** Loads data from CSV files and restructures it to fit the project
 * It's a lot of waiting, but it's just how I got the data, so...
 * 
 * TODO: (ideas to improve the project)
 *  - Add specific income instead of just general income groups (requires a new dataset)
 *  - Add a list of charities to help each country when available (as well as links)
 */
async function load_data() {
    hi_income_data = await d3.csv('./data/water_and_sanitation_high_income.csv');
    med_hi_income_data = await d3.csv('./data/water_and_sanitation_high_mid_income.csv');
    low_income_data = await d3.csv('./data/water_and_sanitation_low_income.csv');
    med_low_income_data = await d3.csv('./data/water_and_sanitation_low_mid_income.csv');

    dict = {};
    function push_iso(data, income_group) { // Adds all countries to a dictionary with ISO3 as key
        if (!dict[data['ISO3']]) dict[data['ISO3']] = [];
        data['income_group'] = income_group;
        dict[data['ISO3']].push(data);
    }

    hi_income_data.forEach((d) => push_iso(d,'high income'));
    med_hi_income_data.forEach((d) => push_iso(d,'mid-high income'));
    low_income_data.forEach((d) => push_iso(d,'low income'));
    med_low_income_data.forEach((d) => push_iso(d,'mid-low income'));

    data = []
    // Add some stuff here to find other metrics for sanitation and drinkingwater
    function restructure(entry) { // Extracts relevant data to form a single JSON object per country of relevant data
        info = {'ISO3': entry[0]};
        entry = entry[1];
        info['Country'] = entry[0]['Country'];
        info['IncomeGroup'] = entry[0]['income_group'];
        for (var i = 0; i < entry.length; i++) {
            if (entry[i]['Service Type'] == 'Sanitation'     && entry[i]["Service level"] == 'At least basic') info['Sanitation'] = parseFloat(entry[i]['Coverage']);
            if (entry[i]['Service Type'] == 'Drinking water' && entry[i]["Service level"] == 'At least basic') info['DrinkingWater'] = parseFloat(entry[i]['Coverage']);
        }
        data.push(info);
    }
    Object.entries(dict).forEach(d => restructure(d));

    geojson = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
}


function handlescroll(event) {
    if (scroll + event.deltaY > 0 && scroll + event.deltaY < num_scenes * scroll_dist) scroll += event.deltaY;
    prev = current_scene;
    current_scene = Math.floor(scroll / scroll_dist);
    if (current_scene != prev) set_scene(prev);
}


function set_scene(prev) {
    d3.select('svg').attr('width', height).attr('height', height);
    scene_size = height - 2 * margin;

    switch(current_scene) {
        case 0:
            var x = d3.scaleBand().domain(['low income','mid-low income','mid-high income', 'high income']).range([0,scene_size]);
            const p1 = 9101223931;
            const p2 = 8097441697;
            function randx(d, i) {
                var rand = (p1 * (i+1) % p2) / p2; // seems like a way to generate a consistent prandom number? just a guess tho
                return x(d) + x.bandwidth() * 0.5 + (0.60 * x.bandwidth() * (rand - 0.5))
            }
            var y = d3.scaleLinear().domain([40, 100]).range([scene_size, 0]);
            var color = d3.scaleLinear().domain([0, 2 * scene_size]).range(['brown', 'aqua'])

            if (prev == -1) {
                // clear and start from nothing
                d3.select('#data').selectAll('*').remove();
                d3.select('#data').selectAll('circle').data(data.filter((d) => d.DrinkingWater)).enter().append('circle')
                .attr('id', d => d.Country).attr('r', r)
                .attr('cx', (d, i) => randx(d.IncomeGroup, i))
                .transition().duration(1000)
                .attr('cy', (d) => y(d.DrinkingWater) + 2*r)
                .attr('stroke', (d, i) => color(randx(d.IncomeGroup, i) + scene_size - y(d.DrinkingWater)));
            } else {
                // Reuse circles and transition
                var points = d3.select('#data').selectAll('circle').data(data.filter((d) => d.DrinkingWater))
                points.exit().remove();
                points.transition().duration(1000)
                .attr('cx', (d, i) => randx(d.IncomeGroup, i))
                .attr('cy', (d) => y(d.DrinkingWater) + 2*r)
                .attr('stroke', (d, i) => color(randx(d.IncomeGroup, i) + scene_size - y(d.DrinkingWater)));
                points.enter().append('circle').attr('id', d => d.Country).attr('r', r)
                .attr('cx', (d, i) => randx(d.IncomeGroup, i))
                .transition().duration(1000)
                .attr('cy', (d) => y(d.DrinkingWater) + 2*r)
                .attr('stroke', (d, i) => color(randx(d.IncomeGroup, i) + scene_size - y(d.DrinkingWater)));
            }

            d3.selectAll('.axis').remove();

            d3.select('svg')
            .append('g').attr('transform', `translate(${margin},${margin})`).attr('class','axis')
            .call(d3.axisLeft(y));

            d3.select('svg')
            .append('g').attr('transform', `translate(${margin},${margin})`).attr('class','axis')
            .call(d3.axisTop(x));

            break;
        case 1:
            var x = d3.scaleLinear().domain([40,100]).range([0,scene_size]);
            var y = d3.scaleLinear().domain([ 0,100]).range([scene_size,0]);
            var color = d3.scaleLinear().domain([0,100]).range(['brown','aqua'])

            // Just move circles
            var points = d3.select('#data').selectAll('circle').data(data.filter((d) => d.DrinkingWater && d.Sanitation));
            points.exit().remove();
            points.transition().duration(1000)
            .attr('cx', d => x(d.DrinkingWater))
            .attr('cy', d => y(d.Sanitation))
            .attr('stroke', d => color(d.Sanitation));
            points.enter().append('circle').attr('id', d => d.Country).attr('r', r)
            .attr('cx', d => x(d.DrinkingWater))
            .attr('cy', d => y(d.Sanitation))
            .attr('stroke', d => color(d.Sanitation));

            d3.selectAll('.axis').remove();

            d3.select('svg')
            .append('g').attr('transform', `translate(${margin},${margin})`).attr('class','axis')
            .call(d3.axisLeft(y));

            d3.select('svg')
            .append('g').attr('transform', `translate(${margin},${height-margin})`).attr('class','axis')
            .call(d3.axisBottom(x));

            break;
        case 2:
            
            d3.selectAll('.axis').remove();
            var rscale = d3.scaleLinear().domain([30,100]).range([4*r,r]);
            const cols = 15;
            col_width = (height - 2 * margin) / cols;
            var color = d3.scaleLinear().domain([0,100]).range(['brown','aqua']);
            function radius(val) {
                if (val) return rscale(val);
                return r;
            }

            function color_protected(val) {
                if (val) return color(val);
                return 'black';
            }

            var points = d3.select('#data').selectAll('circle').data(data);
            points.exit().remove();
            points.transition().duration(1000)
            .attr('r', d => radius(d.DrinkingWater))
            .attr('cx', (_,i) => (i % cols) * col_width + r)
            .attr('cy', (_,i) => Math.floor(i / cols) * col_width + r);
            points.enter().append('circle').attr('id', d => d.Country)
            .attr('r', d => radius(d.DrinkingWater))
            .attr('cx', (_,i) => (i % cols) * col_width + r)
            .attr('cy', (_,i) => Math.floor(i / cols) * col_width + r)
            .attr('stroke', d => color_protected(d.Sanitation));
            d3.select('#data').selectAll('circle').on('click', d => console.log(d.target.id));

            break;
        default:
            // Do nothing
    };
}

var annotated_node = null;
function handlemove(event) {

    // Takes a NodeList and finds the node closest to the pointer
    function closest(nodes) {
        var dist = -1;
        var closest = null;
        for (var i = 0; i < nodes.length; i++) {
            box = nodes[i].getBoundingClientRect();
            d = Math.abs(event.clientX - (box.left + r)) + Math.abs(event.clientY - (box.top + r));
            
            if (!closest || d < dist) {
                dist = d;
                closest = nodes[i];
            }
        }
        return closest;
    }

    // Check if mouse is inside the target
    if (annotated_node) annotated_node.classList.remove('highlighted');
    d3.select('#tooltip').style('opacity', 0);
    if (event.path[0].id == 'tooltip' || event.path[0].tagName == 'svg' || event.path[2].tagName == 'svg') {
        // find closest circle
        node = closest(d3.select('svg').selectAll('circle')._groups[0]);
        d3.select('#tooltip').html(node.id);

        annotated_node = node;
        annotated_node.classList.add('highlighted');

        canvas_box = d3.select('svg')._groups[0][0].getBoundingClientRect();
        x = node.cx.baseVal.value + canvas_box.left + margin + 2 * r;
        y = node.cy.baseVal.value + canvas_box.top + margin - 2.5 * r;
        d3.select('#tooltip').transition().duration(50).style('left', x + 'px').style('top', y + 'px').style('opacity', 0.60);
    }
    
}