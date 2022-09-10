from google.cloud import ndb


class User(ndb.Model):
    firebase_user_id = ndb.StringProperty()
    email = ndb.StringProperty()

    # The following four properties are necessary for use in conjunction with
    # the flask-login library
    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_active(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return True

    @property
    def get_id(self) -> bool:
        return self.firebase_user_id


class Algorithm(ndb.Model):
    author = ndb.KeyProperty(required=True,kind='User')
    name = ndb.StringProperty()
    category = ndb.StringProperty()
    script = ndb.StringProperty()
    viz = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now=True)
    public = ndb.BooleanProperty()
    events = ndb.StringProperty()


class Log(ndb.Model):
    author = ndb.KeyProperty(required=True,kind='User')
    msg = ndb.StringProperty()
    date = ndb.DateTimeProperty(auto_now=True)


class Comment(ndb.Model):
    author = ndb.KeyProperty(required=True,kind='User')
    name = ndb.StringProperty()
    content = ndb.TextProperty()
    date = ndb.DateTimeProperty(auto_now=True)
    
