try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    # pymysql not available, fall back to MySQLdb
    pass