import re

from odoo.tools import html2plaintext, html_sanitize

# Longer formatted texts travel as plain text only
HTML_MAX = 20000


def html_to_text(html):
    if not html:
        return ""
    # html2plaintext joins list items on one line, renders <b>x</b> as *x*
    # and adds link footnotes ("@Julien [1]").
    html = re.sub(r"<a\b[^>]*>(.*?)</a>", r"\1", str(html), flags=re.DOTALL)
    html = re.sub(r"<li[^>]*>", "<br/>• ", html)
    html = re.sub(r"</ul>|</ol>", "<br/>", html)
    return re.sub(r"\*([^*\n]+)\*", r"\1", html2plaintext(html)).strip()


def clean_html(html):
    """Formatted text (bold, lists, links...) as Odoo shows it, cleaned again:
    the phone also keeps only safe tags. False when empty or too long."""
    if not html or not html_to_text(html):
        return False
    html = html_sanitize(str(html), strip_style=True, strip_classes=True)
    return html if len(html) <= HTML_MAX else False
