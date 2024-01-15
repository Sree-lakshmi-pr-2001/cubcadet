export default (editor, configs = {}) => {
    let bm = editor.BlockManager;

    const img_src_default_mobile = configs.lyonscgConfigs.img_src_default_mobile;
    const img_src_default_tablet = configs.lyonscgConfigs.img_src_default_tablet;
    const img_src_default_desktop = configs.lyonscgConfigs.img_src_default_desktop;

      bm.add('hero').set({
        label: configs.lyonscgPluginConfigs.default_labels.hero,
        category: 'Custom',
        attributes: {class:'fa fa-address-card'},
        content:{
            type: 'hero',
            content:
            `<div class="container" data-gjs-type="default">
            <div class="row" data-gjs-type="row">
                    <div class="col d-flex col-12 col-lg-8 order-lg-2 order-1" data-gjs-type="column">
                        <picture data-gjs-type="responsive_image">
                            <source data-gjs-type="responsive_image_source" srcset="https://via.placeholder.com/1015x765" media="(min-width: 1025px)" data-type="desktopimage" />
                            <source data-gjs-type="responsive_image_source" srcset="https://via.placeholder.com/738x495" media="(min-width: 768px)" data-type="tabletimage" />
                            <source data-gjs-type="responsive_image_source" srcset="https://via.placeholder.com/345x325" media="(max-width: 767px)" data-type="mobileimage" />
                            <img data-gjs-type="img" alt="" src="https://via.placeholder.com/345x325" class="img-fluid" />
                        </picture>
                    </div>
                    <!-- text block -->
                    <div class="text-block col d-flex col-12 col-lg-4 order-1 order-lg-1 text-dark bg-secondary" data-gjs-type="column">
                        <div data-gjs-type="default">
                            <div class="intro-block d-none d-lg-block" data-gjs-type="default">
                                <span class="intro1 label-1">INTRO1: </span>
                                <span class="intro2 label-1 text-info">Desktop INTRO 2 IN COLOR 2</span>
                            </div>
                            <div class="display-1">Display-1 Heading That Wraps</div>
                            <div class="copy-block">
                                <div class="p">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                </p>
                            </div>
                            <div class="cta-container"><a href="" data-type="ctatext" role="button" class="btn btn-primary">SHOP Category</a>

                            </div>
                            <div class="cta-container"><a href="" data-type="ctatext" role="button" class="btn btn-video-black-ol">
                                    See It In Action
                                </a>

                            </div>
                        </div>
                    </div>
                </div>
            </div>`
        }
    });
  }
