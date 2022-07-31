async function init() {
    document.addEventListener('scroll', (e) => scrollhandler(e));


    hi_income_data = await d3.csv('./data/water_and_sanitation_high_income.csv');
    console.log(hi_income_data);

    /**
     * Layout Plan - Martini glass
     *  - Scene 1: Scatterplot with water access versus income, shouldn't be much of a surprise, but should give contex for what I am trying to show
     *  - Scene 2: Scatterplot with water access versus some other metric, maybe health or access to sanitation. Should narrow in on the issue or some bullshit like that
     *  - Scene 3: Map showing all countries with data available. Color is determined by access to water, and clicking should give access to organizations to donate to.
     */
}

function scrollhandler(event) {
    // event.target.preventDefault();
    console.log(window.scrollY);
}