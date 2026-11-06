// Mensajes flash guardados en una cookie de corta vida: se leen una vez y se borran.
module.exports = (req, res, next) => {
  res.locals.flash = req.cookies.flash || null;
  if (req.cookies.flash) res.clearCookie('flash');

  req.flash = (type, message) => {
    res.cookie('flash', { type, message }, { httpOnly: true, sameSite: 'lax', maxAge: 15000 });
  };
  next();
};
