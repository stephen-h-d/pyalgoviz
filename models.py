from google.cloud import ndb


class Algorithm(ndb.Model):
    author = ndb.UserProperty()
    name = ndb.StringProperty()
    category = ndb.StringProperty()
    script = ndb.StringProperty()
    viz = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now=True)
    public = ndb.BooleanProperty()
    events = ndb.StringProperty()


class Log(ndb.Model):
    author = ndb.UserProperty()
    msg = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now=True)


class Comment(ndb.Model):
    author = ndb.UserProperty()
    name = ndb.StringProperty()
    content = ndb.TextProperty()
    date = ndb.DateTimeProperty(auto_now=True)
    
