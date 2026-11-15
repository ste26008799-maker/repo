// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vlxxai",
        "name": "VLXXAI",
        "version": "1.0.0",
        "baseUrl": "https://vlxxai.com",
        "iconUrl": "https://raw.githubusercontent.com/ste26008799-maker/repo/main/plugins/vlxx.ico",
        "isEnabled": true,
        "isAdult": true,
        "type": "MOVIE",
        "playerType": "exoplayer",
        "layoutType": "HORIZONTAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'DC', title: 'PHIM HOT ĐỀ CỬ', type: 'Horizontal', path: 'category' },
        { slug: 'MCN', title: 'Mới Cập Nhật', type: 'Horizontal', path: 'category' },
        { slug: 'dht', title: 'Đã Hoàn Thành', type: 'Horizontal', path: 'category' },
        { slug: 'dcn', title: 'Đang Cập Nhật', type: 'Horizontal', path: 'category' },
        { slug: 'home', title: 'Phim Sex Mới', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'PHIM HOT ĐỀ CỬ', slug: 'DC' },
        { name: 'Mới Cập Nhật', slug: 'MCN' },
        { name: 'Đã Hoàn Thành', slug: 'dht' },
        { name: 'Đang Cập Nhật', slug: 'dcn' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://vlxxai.com";

    if (slug === '' || slug === 'home') {
        if (page > 1) {
            return baseUrl + "/new/" + page + "/";
        }
        return baseUrl + "/";
    }

    if (page > 1) {
        return baseUrl + "/" + slug + "/" + page + "/";
    }
    return baseUrl + "/" + slug + "/";
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var safeKeyword = encodeURIComponent(keyword.replace(/\s+/g, '-'));
    var url = "https://vlxxai.com/search/" + safeKeyword + "/";
    if (page > 1) {
        url = "https://vlxxai.com/search/" + safeKeyword + "/" + page + "/";
    }
    return url;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    if (slug.charAt(0) !== '/') slug = '/' + slug;
    return "https://vlxxai.com" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    var items = [];
    var blocks = html.split('class="video-item"');

    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];

        var linkMatch = block.match(/href=["']([^"']+)["']/i);
        var link = linkMatch ? linkMatch[1] : "";

        var titleMatch = block.match(/title=["']([^"']+)["']/i);
        var title = titleMatch ? titleMatch[1] : "";

        var thumbMatch = block.match(/data-original=["']([^"']+)["']/i);
        if (!thumbMatch) {
            thumbMatch = block.match(/<img[^>]*src=["']([^"']+)["']/i);
        }
        var thumb = thumbMatch ? thumbMatch[1] : "";

        if (thumb && thumb.indexOf("data:image") === 0) thumb = "";

        if (link && title) {
            items.push({
                id: link,
                title: title.replace(/<[^>]+>/g, '').trim(),
                posterUrl: thumb,
                backdropUrl: thumb,
                year: 0
            });
        }
    }

    var currentPage = 1;
    var totalPages = 1;

    var cpMatch = html.match(/<a[^>]*class=["'][^"']*active[^"']*["'][^>]*data-page=["'](\d+)["']/i);
    if (cpMatch) {
        currentPage = parseInt(cpMatch[1]);
    }

    var lpRegex = /<a[^>]*data-page=["'](\d+)["'][^>]*>[0-9]+<\/a>/gi;
    var lpMatch;
    while ((lpMatch = lpRegex.exec(html)) !== null) {
        var pageNum = parseInt(lpMatch[1]);
        if (pageNum > totalPages) totalPages = pageNum;
    }
    if (currentPage > totalPages) totalPages = currentPage;

    return JSON.stringify({
        items: items,
        pagination: {
            currentPage: currentPage,
            totalPages: totalPages
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h1[^>]*page-title[^>]*>([\s\S]*?)<\/h1>/i)
            || html.match(/<h2[^>]*page-title[^>]*>([\s\S]*?)<\/h2>/i)
            || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        var descMatch = html.match(/<div[^>]*class=["']video-description["'][^>]*>([\s\S]*?)<\/div>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        var codeMatch = html.match(/<span[^>]*class=["']video-code["'][^>]*>([\s\S]*?)<\/span>/i);
        var code = codeMatch ? codeMatch[1].replace(/<[^>]+>/g, '').trim() : "";

        if (code && title) {
            title = "(" + code + ") " + title;
        }

        var ogImg = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        var posterUrl = ogImg ? ogImg[1] : "";

        var castsArr = [];
        var castRegex = /<div[^>]*class=["']actress-tag["'][^>]*><a[^>]*>([\s\S]*?)<\/a>/gi;
        var castMatch;
        while ((castMatch = castRegex.exec(html)) !== null) {
            castsArr.push(castMatch[1].replace(/<[^>]+>/g, '').trim());
        }

        var categoriesArr = [];
        var catSectionMatch = html.match(/<div[^>]*class=["']category-tag["'][^>]*>([\s\S]*?)<\/div>/i);
        if (catSectionMatch) {
            var catSection = catSectionMatch[1];
            var catRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
            var cmMatch;
            while ((cmMatch = catRegex.exec(catSection)) !== null) {
                categoriesArr.push(cmMatch[1].replace(/<[^>]+>/g, '').trim());
            }
        }

        var servers = [];

        var canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
        var pageUrl = canonicalMatch ? canonicalMatch[1] : "";

        var serverRegex = /onclick=["']server\((\d+),\s*(\d+)\)["']/gi;
        var srvMatch;

        while ((srvMatch = serverRegex.exec(html)) !== null) {
            var serverId = srvMatch[1];
            servers.push({
                name: "Server #" + serverId,
                episodes: [{
                    id: pageUrl + "#s" + serverId,
                    name: "Full",
                    slug: "full-s" + serverId
                }]
            });
        }

        if (servers.length === 0 && pageUrl) {
            servers.push({
                name: "Server #1",
                episodes: [{
                    id: pageUrl + "#s1",
                    name: "Full",
                    slug: "full"
                }]
            });
        }

        return JSON.stringify({
            id: pageUrl, // Đã sửa từ id: "" thành id: pageUrl
            title: title.replace(/<[^>]+>/g, '').trim(),
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            servers: servers,
            quality: "HD",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            casts: castsArr.join(", "),
            director: "",
            country: "",
            category: categoriesArr.join(", "),
            status: code || "Full"
        });

    } catch (e) {
        return "null";
    }
}

// =============================================================================
// STREAM RESOLUTION
// =============================================================================

function parseDetailResponse(html, fetchedUrl) {
    try {
        var dataIdMatch = html.match(/data-id=["'](\d+)["']/i);
        var videoId = dataIdMatch ? dataIdMatch[1] : "";

        if (!videoId && fetchedUrl) {
            var urlIdMatch = fetchedUrl.match(/\/(\d+)\/?(?:#|$)/);
            if (urlIdMatch) videoId = urlIdMatch[1];
        }

        if (!videoId) {
            return JSON.stringify({ url: "", isEmbed: false, headers: {} });
        }

        var serverId = "1";
        if (fetchedUrl) {
            var fragMatch = fetchedUrl.match(/#s(\d+)/);
            if (fragMatch) serverId = fragMatch[1];
        }

        var deviceMatch = html.match(/deviceType\s*=\s*['"](\w+)['"]/i);
        var deviceType = deviceMatch ? deviceMatch[1] : "mobile";
        var vlxxServer = (deviceType === "desktop") ? "1" : "2";

        return JSON.stringify({
            url: "https://vlxxai.com/ajax.php",
            isEmbed: true,
            postBody: "vlxx_server=" + vlxxServer + "&id=" + videoId + "&server=" + serverId,
            headers: {
                "Referer": "https://vlxxai.com/",
                "Stream-Regex": "https?:\\/\\/[^\"'\\s]+\\.(?:vl|m3u8|mp4)[^\"'\\s]*"
            }
        });
    } catch (error) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}

function parseEmbedResponse(html, url) {
    try {
        if (html.indexOf('"player"') !== -1) {
            try {
                var jsonObj = JSON.parse(html);
                if (jsonObj && jsonObj.player) {
                    var playerHtml = jsonObj.player;
                    var srcMatch = playerHtml.match(/src=["']([^"']+)["']/i);
                    if (srcMatch) {
                        return JSON.stringify({
                            url: srcMatch[1],
                            isEmbed: true,
                            headers: {
                                "Referer": "https://vlxxai.com/" // Đã sửa lỗi vlxai.com thành vlxxai.com
                            }
                        });
                    }
                }
            } catch (parseErr) {
                var cleaned = html.replace(/\\\//g, '/');
                var iframeMatch = cleaned.match(/src=(?:\\\\)?["'](https?:\/\/[^"'\\]+)(?:\\\\)?["']/i);
                if (iframeMatch) {
                    return JSON.stringify({
                        url: iframeMatch[1],
                        isEmbed: true,
                        headers: {
                            "Referer": "https://vlxxai.com/"
                        }
                    });
                }
            }
        }

        var fileMatch = html.match(/"file"\s*:\s*"(https?[^"]+\.vl[^"]*)"/i);
        if (fileMatch) {
            return JSON.stringify({
                url: fileMatch[1],
                isEmbed: false,
                mimeType: "application/x-mpegURL",
                headers: {
                    "Referer": "https://play.vlstream.net/"
                }
            });
        }

        var sourcesMatch = html.match(/sources\s*:\s*(\[[^\]]+\])/i);
        if (sourcesMatch) {
            try {
                var sources = JSON.parse(sourcesMatch[1]);
                if (sources && sources.length > 0 && sources[0].file) {
                    var sFile = sources[0].file;
                    var isHls = (sources[0].type === 'hls') || sFile.indexOf('.vl') !== -1 || sFile.indexOf('.m3u8') !== -1;
                    return JSON.stringify({
                        url: sFile,
                        isEmbed: false,
                        mimeType: isHls ? 'application/x-mpegURL' : (sFile.indexOf('.mp4') !== -1 ? 'video/mp4' : ''),
                        headers: {
                            "Referer": "https://play.vlstream.net/"
                        }
                    });
                }
            } catch (e) {
                var regexFile = sourcesMatch[1].match(/"file"\s*:\s*"([^"]+)"/i);
                if (regexFile) {
                    return JSON.stringify({
                        url: regexFile[1],
                        isEmbed: false,
                        mimeType: "application/x-mpegURL",
                        headers: {
                            "Referer": "https://play.vlstream.net/"
                        }
                    });
                }
            }
        }

        var vlMatch = html.match(/(https?:\/\/[^\s"'\\]+\.vl[^\s"'\\]*)/i);
        if (vlMatch) {
            return JSON.stringify({
                url: vlMatch[1],
                isEmbed: false,
                mimeType: "application/x-mpegURL",
                headers: {
                    "Referer": "https://play.vlstream.net/"
                }
            });
        }

        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {} });
    }
}
