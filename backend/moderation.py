"""Screening for anonymous comments.

Comments are auto-approved unless they appear to contain personal
information — names, contact details, or identifying numbers. Screening
errs toward over-flagging: a flagged comment is only held for moderator
review, never rejected outright.
"""

import re

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(?<!\d)(?:\+?1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4}(?!\d)")
SSN_RE = re.compile(r"(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)")
HANDLE_RE = re.compile(r"(?<!\w)@\w{3,}")
SOCIAL_RE = re.compile(
    r"\b(?:instagram|insta|snapchat|snap|tiktok|twitter|facebook|discord|telegram)\b[ :]*[\w.]{3,}",
    re.IGNORECASE,
)
HONORIFIC_RE = re.compile(
    r"\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Professor|Officer|Sgt|Sergeant|Chief|Coach|Dean|TA|RA)\.? +[A-Z][a-z]+"
)
NAMED_RE = re.compile(r"\b(?:named?(?: is| was)?|called|goes by|known as) +[A-Z][a-z]+")

# Common US first names (lowercase). Used to catch "I saw Jake near the lot"
# and "it was Sarah Miller" without flagging place names like Granite Pass.
FIRST_NAMES = frozenset("""
aaron abigail adam aiden alex alexander alexis alice alyssa amanda amber amy andrea andrew
angela anna anthony ashley austin bailey barbara benjamin beth bill blake bob bobby brad
bradley brandon brenda brian brittany bruce bryan caleb cameron carl carlos carol caroline
carrie casey catherine chad charles charlie chase chelsea chloe chris christian christina
christopher cindy claire cody cole colin connor courtney craig crystal cynthia dakota dan
daniel danielle dave david deborah dennis derek diana diego dominic donald donna doris
douglas dustin dylan edward elena elijah elizabeth ella emily emma eric erica erin ethan
evan evelyn frank gabriel gary gavin george grace greg gregory hailey hannah harold heather
henry holly hunter ian isaac isabella jack jackson jacob jake james jamie janet jason javier
jay jean jeff jeffrey jennifer jeremy jesse jessica jill jim joan joe joel john johnny jon
jonathan jordan jose joseph josh joshua joyce juan judith julia julian julie justin kaitlyn
karen kate katelyn katherine kathleen kathryn katie kayla keith kelly kevin kim kimberly
kyle landon larry laura lauren lawrence leah lee leo leslie liam lily linda lisa logan lucas
luis luke madison marcus margaret maria marie marissa mark martha mary mason matt matthew
megan melissa michael michelle miguel mike molly morgan nancy natalie nathan nicholas nicole
noah nolan olivia oscar owen pamela patricia patrick paul paula peter philip rachel ralph
randy raymond rebecca richard riley robert roger ronald rose roy russell ruth ryan sam
samantha samuel sandra sara sarah scott sean seth sharon shawn shirley sofia sophia stephanie
stephen steve steven susan sydney tanner taylor teresa terry theresa thomas tiffany tim
timothy todd tom travis trevor tyler valerie vanessa victor victoria vincent walter wayne
wendy wesley william wyatt xavier zachary zoe
""".split())

_WORD_RE = re.compile(r"[A-Za-z][a-z]*")
_SENTENCE_START_RE = re.compile(r"(?:^|[.!?]\s+|\n\s*)$")


def _possible_name(text: str) -> bool:
    """True if a common first name appears capitalized mid-sentence, or is
    followed by another capitalized word (likely a surname) anywhere."""
    for m in _WORD_RE.finditer(text):
        word = m.group()
        if not word[0].isupper() or word.lower() not in FIRST_NAMES:
            continue
        rest = text[m.end():]
        follower = _WORD_RE.search(rest[:40])
        if follower and follower.group()[0].isupper() and rest[: follower.start()].strip() == "":
            return True  # "Jake Lawson"
        if not _SENTENCE_START_RE.search(text[: m.start()]):
            return True  # mid-sentence "…saw Jake near…"
    return False


def screen_comment(text: str) -> list[str]:
    """Return a list of human-readable reasons the comment needs review.
    Empty list means it is safe to auto-approve."""
    reasons = []
    if EMAIL_RE.search(text):
        reasons.append("email address")
    if PHONE_RE.search(text):
        reasons.append("phone number")
    if SSN_RE.search(text):
        reasons.append("SSN-like number")
    if HANDLE_RE.search(text) or SOCIAL_RE.search(text):
        reasons.append("social media handle")
    if HONORIFIC_RE.search(text):
        reasons.append("title + name")
    if NAMED_RE.search(text):
        reasons.append("names a person")
    if _possible_name(text):
        reasons.append("possible name")
    return reasons
