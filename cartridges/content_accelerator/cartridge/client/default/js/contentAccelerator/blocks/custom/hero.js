'use strict';
/* global window.editor */

module.exports = window.editor.BlockManager.add('hero', {
    category: 'Templates',
    label: 'Hero',
    attributes: {
        class: 'fa fa-window-maximize'
    },
    content: `
        <div class="home-hero1">
            <div class="content-container">
                <div class="row ">
                    <div class="row_1_block_1 col " data-row-index="0" data-row-position="1" data-block-index="0"
                    data-block-position="1">
                        <picture>
                            <!-- desktop image -->
                            <!-- //For SFCC <source media="(min-width: 1025px)" srcset="images/content-assets/homepage/cd-hero1.png?$staticlink$">-->
                            <source media="(min-width: 1025px)" srcset="https://via.placeholder.com/1015x765"
                            data-type="desktopimage">
                                <!-- tablet image -->
                                <!-- // For SFCC <source media="(min-width: 768px)" srcset="images/content-assets/homepage/cd-hero1.png?$staticlink$">-->
                                <source media="(min-width: 768px)" srcset="https://via.placeholder.com/738x495"
                                data-type="tabletimage">
                                    <!-- default is mobile image -->
                                    <!-- // For SFCC <img alt="" src="images/content-assets/homepage/cd-hero1-m.png?$staticlink$"/>-->
                                    <img class="w-100" alt="" src="https://via.placeholder.com/345x325"
                                    data-type="mobileimage">
                        </picture>
                        <div class="block-content row  d-flex position-absolute h-100 w-100 ">
                            <div class="block-content-inner col d-flex position-absolute h-100 w-100 align-items-end justify-content-start align-items-lg-center justify-content-lg-start ">
                                <div class="content-inner-wrapper w-100 w-lg-50 p-5 p-lg-5 text-left ">
                                    <div class="small color-white" data-index="0">Available 10/12/2018</div>
                                    <div class="display-1 color-white" data-index="1">Call of Duty Black Ops 4</div>
                                    <div class="display-6 color-white" data-index="2">Pre-Order and get private access to the private beta.</div>
                                    <div class="cta-container"> <a href="" data-type="ctatext" data-index="0"
                                        class="btn btn-primary" role="button">Pre-Order Now</a>
                                        <a href="" target="" title=""
                                        data-type="ctatext" data-index="1" class="btn btn-outline-primary" role="button">Learn More</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
});
