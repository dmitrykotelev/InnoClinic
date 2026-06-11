using System.Linq.Expressions;

namespace Middleware.AppoitnmentFiltrator
{
    internal class ParameterReplacer : ExpressionVisitor
    {
        private readonly ParameterExpression _oldParameter;
        private readonly ParameterExpression _newParameter;

        public ParameterReplacer(ParameterExpression oldParameter, ParameterExpression newParameter)
        {
            _oldParameter = oldParameter;
            _newParameter = newParameter;
        }

        protected override Expression VisitParameter(ParameterExpression node)
        {
            if (ReferenceEquals(node, _oldParameter))
                return _newParameter;

            return base.VisitParameter(node);
        }
    }
}
