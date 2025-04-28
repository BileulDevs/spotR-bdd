module.exports = {
    getMetrics: async (req, res) => {
        try {
            res.status(200).json({
                message: "LOG OK"
            })
        } catch (err) {
            res.status(500).json({
                message: err.message
            })
        }
    }
}