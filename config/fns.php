<?php
require_once __DIR__.'/../vendor/autoload.php';
use Contentful\RichText\NodeRenderer\NodeRendererInterface;
use Contentful\RichText\Node\EntryHyperlink;
use Contentful\RichText\Node\NodeInterface;
use Contentful\RichText\RendererInterface;

class BlogPostEntryHyperlink implements NodeRendererInterface
{
    public function supports(NodeInterface $node): bool
    {
        if (!$node instanceof EntryHyperlink) {
            return false;
        }
        return false;
    }

    /**
     * This method is supposed to transform a node object into a string
     */
    public function render(RendererInterface $renderer, NodeInterface $node, array $context = []): string
    {
        return '';
    }
}


add_action('init', function(){
    global $ana_site;
    global $contentful_client;
    $contentful_client = new \Contentful\Delivery\Client(
        $ana_site->config['settings']['contentfulAPIKey'],
        '0gskmdyt0zxy' 
    );
});

function tlb_directory_categories(){
    global $contentful_client;
    $remote_categories = null;//get_transient('tlb_directory_categories');
    if(!$remote_categories){
        $query = new \Contentful\Delivery\Query();
        $query->setContentType('categoryTag');
        $query->orderBy('fields.category');
        $query->where('fields.category[exists]', true);
        $query->setLimit(1000);
        $entries = $contentful_client->getEntries($query);
        $remote_categories = [];
        $used = [];
        foreach($entries as $entry){
            if(in_array($entry->category, $used)){
                continue;
            }
            $used[] = $entry->category;
            $remote_categories[] = [
                'name' => $entry->category,
                'slug' => sanitize_title($entry->category),
                'link' => '/directory/category/'.sanitize_title($entry->category),
                'taxonomy' => 'directory-category'
            ];
        }
        set_transient('tlb_directory_categories', $remote_categories, 60 * 60);
    }
    $local = Timber::get_terms([
        'taxonomy' => 'directory-category',
    ]);

    $categories = array_merge($remote_categories, $local);

    // remove duplicates
    $used = [];
    $categories = array_filter($categories, function($category) use (&$used){
        if(in_array(((object)$category)->name, $used)){
            return false;
        }
        $used[] = ((object)$category)->name;
        return true;
    });

    // sort on title
    usort($categories, function($a, $b){
        $a = (object) $a;
        $b = (object) $b;
        return strcmp($a->name, $b->name);
    });

    $categories = array_map(function($category){
        if(is_object($category)){
            $category = [
                'name' => $category->name,
                'slug' => $category->slug,
                'link' => $category->link,
                'taxonomy' => $category->taxonomy
            ];
        }
        if(get_query_var('directory-map')){
            $category['link'] = '/directory/map/category/'.$category['slug'];
        }
        return $category;
    }, $categories);
    
    

    return $categories;
}

function tlb_get_events(){
    global $contentful_client;

    $remote_posts = null;//get_transient('tlb_events_posts');

    if(!$remote_posts){
        $query = new \Contentful\Delivery\Query();
        $query->setContentType('blogPost');
        $query->orderBy('fields.startDate');
        $query->where('fields.title[exists]', true);
        $query->where('fields.endDate[gt]', new DateTime());
        $query->where('fields.pageType.sys.id[in]', '3QoINDeCDylAbfY84NUDzt');
        $query->setLimit(1000);
        $query->setInclude(2);
        $entries = $contentful_client->getEntries($query);

        $remote_posts = [];

        foreach($entries as $entry) {
            $image = $entry->image;
            $thumbnail = isset($image) ? $image->getFile()->getUrl() : null;
            $renderer = new \Contentful\RichText\Renderer([new BlogPostEntryHyperlink()]);
            $content = $entry->content[0];
            $body = $content->bodyText ? $renderer->render($content->bodyText):'';


        
            $post = [
                'ID' => $entry->getId(),
                'id' => $entry->getId(),
                'title' => $entry->title,
                'name' => $entry->slug,
                'type' => 'events',
                'post_type' => 'events',
                'is_remote' => true,
                'data' => [],
                'excerpt' => @$entry->excerpt,
                'thumbnail' => $thumbnail,
                'link' => '/events/'.$entry->slug,
                'content' => $body,
                'startDate' => $entry->startDate,
                'endDate' => $entry->endDate,
                'terms' => [
                    [
                        'taxonomy'=>'events-site',
                        'name'=>'At London Bridge',
                        'slug'=>'remote'
                    ]
                ]
            ];

            set_transient('tlb_events_post_'.$post['name'], $post, 60 * 60);

            $remote_posts[] = $post;

        }



        set_transient('tlb_events_posts', $remote_posts, 60 * 60);
    }

    $local_query = [
        'post_type' => 'events',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ];

    $local_posts = Timber::get_posts($local_query)->getArrayCopy();

    // Merge remote and local posts
    $posts = array_merge($remote_posts, $local_posts);

    // Sort posts by startDate
    usort($posts, function($a, $b) {
        // either ->title or ['title]
        if(is_object($a)) {
            $from = get_field('from', $a->ID);
        } else {
            $from = $a['startDate'];
        }

        if(is_object($b)) {
            $to = get_field('to', $b->ID);
        } else {
            $to = $b['endDate'];
        }

        strtotime($from) > strtotime($to);
    });

    return $posts;
}

function tlb_directory_posts($category = null) {
    global $contentful_client;

    $remote_posts = get_transient('tlb_directory_posts');

    if(!$remote_posts){
        $query = new \Contentful\Delivery\Query();
        $query->setContentType('locationPage');
        $query->orderBy('fields.title');
        $query->where('fields.title[exists]', true);
        $query->where('fields.hideOnDirectory[ne]', true);
        $query->setLimit(1000);
        $query->setInclude(10);
        $entries = $contentful_client->getEntries($query);

        $remote_posts = [];

        foreach($entries as $entry) {
            $thumbnails = $entry->imageGallery;
            $thumbnail = isset($thumbnails[0]) ? $thumbnails[0]->getFile()->getUrl() : null;
            $renderer = new \Contentful\RichText\Renderer([new BlogPostEntryHyperlink()]);
            $body = $entry->bodyText ? $renderer->render($entry->bodyText):'';
            $website = $entry->website;
            // sometimes not http or https
            if($website && !preg_match('/^https?:\/\//', $website)){
                $website = 'https://'.$website;
            }
            

            $post = [
                'ID' => $entry->getId(),
                'id' => $entry->getId(),
                'title' => $entry->title,
                'name' => $entry->slug,
                'type' => 'directory',
                'post_type' => 'directory',
                'is_remote' => true,
                'data' => [],
                'excerpt' => @$entry->excerpt,
                'thumbnail' => $thumbnail,
                'link' => '/directory/'.$entry->slug,
                'content' => $body,
                'website' => $website,
                'location' => $entry->coordinates,
                'terms' => ( count($entry->categories) > 0) ? [
                    [
                        'name' => $entry->categories[0]->category,
                        'taxonomy' => 'directory-category',
                        'link' => '/directory/category/'.sanitize_title($entry->categories[0]->category),
                        'slug' => sanitize_title($entry->categories[0]->category)
                    ]
                ] : []
            ];

            set_transient('tlb_directory_post_'.$post['name'], $post, 60 * 60);

            $remote_posts[] = $post;

        }



        set_transient('tlb_directory_posts', $remote_posts, 60 * 60);
    }

    if($category){
        // filter remote posts on category slug
        $remote_posts = array_filter($remote_posts, function($post) use ($category) {
            return in_array($category, array_map(function($term) {
                return $term['slug'];
            }, $post['terms']));
        });
    }   


    $local_query = [
        'post_type' => 'directory',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ];

    if($category){
        $local_query['tax_query'] = [
            [
                'taxonomy' => 'directory-category',
                'field' => 'slug',
                'terms' => $category
            ]
        ];
    }


    $local_posts = Timber::get_posts($local_query)->getArrayCopy();

    // Merge remote and local posts
    $posts = array_merge($remote_posts, $local_posts);

    // Sort posts by title
    usort($posts, function($a, $b) {
        // either ->title or ['title]
        if(is_object($a)) {
            $title_a = $a->title();
        } else {
            $title_a = $a['title'];
        }

        if(is_object($b)) {
            $title_b = $b->title();
        } else {
            $title_b = $b['title'];
        }

        return strcmp($title_a, $title_b);
    });

    return $posts;

}

function tlb_post($slug, $type){
    $transient = get_transient('tlb_'.$type.'_post_'.$slug);
    if($transient){
        return $transient;
    } else {
        if($type == 'directory'){
            tlb_directory_posts();
        } else {
            tlb_get_events();
        }
        return get_transient('tlb_'.$type.'_post_'.$slug);
    }
}

add_filter('query_vars', function($vars) {
    $vars[] = 'filter-directory-category';
    $vars[] = 'directory-map';
    return $vars;
});

add_filter('pre_handle_404', function($bool){
    global $wp_query;
    global $is_remote_post;
    global $remote_post_type;
    if(
        (isset($wp_query->query_vars['directory']) ||
        isset($wp_query->query_vars['events'])) && $wp_query->found_posts == 0){
        $is_remote_post = true;
        if(isset($wp_query->query_vars['events'])) {
            $remote_post_type = 'events';
        } else {
            $remote_post_type = 'directory';
        }
        $wp_query->is_singular = false;
        // $wp_query->queried_object = new WP_Post((object) []);
        return true;
    }
    return $bool;
});

add_filter( 'template_include', function($original_template){
    global $is_remote_post;
    if($is_remote_post){
        return get_template_directory() . '/single.php';
    }
    return $original_template;
});

add_filter('timber/context', function($context){
    global $is_remote_post;
    global $remote_post_type;

    if($is_remote_post){
        $context['post'] = tlb_post(get_query_var($remote_post_type), $remote_post_type);
    }
    return $context;
}, 99999, 1);

function tlb_title_fix($title){
    global $is_remote_post;
    global $remote_post_type;
    if($is_remote_post){
        return  get_bloginfo('name').' - '.tlb_post(get_query_var($remote_post_type), $remote_post_type)['title'];
    }
    return $title;
}

add_filter('body_class', function($classes){
    global $is_remote_post;
    global $remote_post_type;
    if($is_remote_post){
        $classes[] = 'single-'.$remote_post_type;
        $classes[] = 'single';
    }
    return $classes;
}); 

add_filter('wp_title', 'tlb_title_fix', 0, 2);
add_filter('wpseo_title', 'tlb_title_fix', 0, 2);