const asyncwrapper = (asyncfn) => {
    return (req, res, next) => {
        asyncfn(req, res, next).catch((err) => {
            console.error('ERROR:', err.message, err.stack); // 👈 add this
            next(err);
        });
    }
}
export default asyncwrapper;