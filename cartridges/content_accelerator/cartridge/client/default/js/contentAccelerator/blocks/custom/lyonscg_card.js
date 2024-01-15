export default (editor, configs = {}) => {
    var bm = editor.BlockManager;
    var label = configs.lyonscgPluginConfigs.default_labels;

    bm.add('cardCategory').set({
        label: label.card,
        category: 'Custom',
        attributes: {class:'fa fa-star'},
        content:
            `<div class="card category-card" style="background-image: url('images/category-tiles/utility_tile_hover.jpg?$staticlink$')">
                <div class="card-body">
                    <h3 class="card-title">Lawn Mowers</h3>
                    <p class="card-text">Our lawn mowers are designed to give you unmatched strength and durability along with the industry’s best warranty. </p>
                    <img class="primary-tile-image" src="images/category-tiles/mowers_tile_main.jpg?$staticlink$" alt="Image Description">
                    <div class="category-cta">
                        <a href="" class="btn btn-outline-secondary btn-sm">Shop Now</a>
                    </div>
                    <div class="category-cta">
                        <a href="" class="link-primary">Learn More</a>
                    </div>
                </div>
            </div>`
    });
}
